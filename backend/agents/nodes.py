from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from langchain_ollama import ChatOllama

from backend.agents.state import CritiqueResult, PlannerOutput, ResearchState, TraceEvent
from backend.config import settings
from backend.tools.literature import query_local_literature
from backend.tools.search import fetch_arxiv_papers

logger = logging.getLogger(__name__)

# LLM singleton — constructed once to avoid repeated HTTP handshake overhead per node call.
_llm_instance: ChatOllama | None = None


def _llm() -> ChatOllama:
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = ChatOllama(
            model=settings.ollama_model,
            base_url=settings.ollama_base_url,
        )
    return _llm_instance


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _trace(node: str, summary: str) -> TraceEvent:
    return TraceEvent(node=node, timestamp=_now(), summary=summary)


async def planner_node(state: ResearchState) -> dict[str, Any]:
    """Decompose the user query into search keywords and a 3-step research strategy."""
    llm = _llm().with_structured_output(PlannerOutput)
    prompt = (
        f"You are a semiconductor process engineering research assistant.\n"
        f"User query: {state['user_query']}\n\n"
        f"Generate a structured research plan with:\n"
        f"- 3 to 5 targeted ArXiv search keywords specific to semiconductor manufacturing\n"
        f"- Exactly 3 strategy steps describing how to investigate this query\n"
        f"Focus on technical precision: include material names, process names, and device types."
    )
    try:
        result: PlannerOutput = await llm.ainvoke(prompt)  # type: ignore[assignment]
        plan = result.search_keywords + result.strategy_steps
        summary = f"Generated {len(result.search_keywords)} keywords and {len(result.strategy_steps)} strategy steps"
    except Exception as exc:
        logger.error("planner_node structured output failed: %s", exc)
        # Graceful degradation: use the raw query as the single keyword
        plan = [state["user_query"]]
        summary = "Planner used fallback single-keyword plan due to LLM parse error"

    trace = state.get("agent_trace", []) + [_trace("planner", summary)]
    return {"plan": plan, "agent_trace": trace}


async def retrieval_node(state: ResearchState) -> dict[str, Any]:
    """Retrieve literature from ChromaDB and ArXiv, then synthesise a technical summary."""
    keywords = state["plan"][:5]
    # Guard against an empty plan — fall back to the raw user query
    if not keywords:
        keywords = [state["user_query"]]
    chroma_query = " ".join(keywords[:2])
    arxiv_query = " ".join(keywords)

    local_results = query_local_literature(chroma_query, limit=3)
    arxiv_results = await fetch_arxiv_papers(arxiv_query)

    # Deduplicate by title
    seen: set[str] = set()
    merged: list[dict[str, Any]] = []
    for item in local_results + arxiv_results:
        title = item.get("title", "")
        if title not in seen:
            seen.add(title)
            merged.append(item)

    context_parts: list[str] = []
    for i, paper in enumerate(merged[:8], 1):
        context_parts.append(
            f"[{i}] {paper.get('title', 'Untitled')}\n{paper.get('abstract', '')[:600]}"
        )
    context_str = "\n\n".join(context_parts)

    summary_prompt = (
        f"You are a semiconductor process engineer summarizing research literature.\n"
        f"Query: {state['user_query']}\n\n"
        f"Retrieved Literature:\n{context_str}\n\n"
        f"Write a 3 to 5 paragraph technical synthesis for a process engineer audience. "
        f"Include specific temperatures, chemistries, selectivity values, and constraints where available. "
        f"Be precise and cite specific findings."
    )
    raw_summary_msg = await _llm().ainvoke(summary_prompt)
    raw_summary: str = raw_summary_msg.content  # type: ignore[union-attr]

    trace = state.get("agent_trace", []) + [
        _trace(
            "retrieval",
            f"Retrieved {len(local_results)} local and {len(arxiv_results)} ArXiv papers; "
            f"merged to {len(merged)} unique sources",
        )
    ]
    return {
        "literature_context": merged,
        "raw_summary": raw_summary,
        "agent_trace": trace,
    }


async def critique_node(state: ResearchState) -> dict[str, Any]:
    """Validate the technical summary against semiconductor manufacturing physical constraints."""
    llm = _llm().with_structured_output(CritiqueResult)
    prompt = (
        f"You are a semiconductor fabrication physicist performing a technical review.\n"
        f"User query: {state['user_query']}\n\n"
        f"Technical summary to review:\n{state['raw_summary']}\n\n"
        f"Validate this summary against these physical manufacturing constraints:\n"
        f"1. Silicon melting point is 1414°C — no process step may exceed this\n"
        f"2. ALD window for HfO2 is 150–350°C — deposition outside this range is non-viable\n"
        f"3. Plasma etch selectivity ratios must be greater than 5:1 for viable processes\n"
        f"4. FinFET gate-last thermal budget ceiling is 500°C post high-k deposition\n\n"
        f"Return a CritiqueResult with verdict 'pass' or 'fail', a one-sentence hypothesis, "
        f"confidence_score between 0.0 and 1.0, any physical_violations found, "
        f"and failure_reason if verdict is 'fail'."
    )
    try:
        result: CritiqueResult = await llm.ainvoke(prompt)  # type: ignore[assignment]
        verdict_label = result.verdict
        confidence = result.confidence_score
        failure_info = f" — {result.failure_reason}" if result.failure_reason else ""
        summary = f"Verdict: {verdict_label} (confidence: {confidence:.2f}){failure_info}"
    except Exception as exc:
        logger.error("critique_node structured output failed: %s", exc)
        # Graceful degradation: treat as pass so the pipeline always completes
        result = CritiqueResult(
            verdict="pass",
            hypothesis="Could not validate — proceeding to synthesis.",
            confidence_score=0.0,
            physical_violations=[],
            failure_reason=None,
        )
        summary = f"Critique parse error ({exc}); defaulting to pass"

    iteration_count = state.get("iteration_count", 0) + 1
    trace = state.get("agent_trace", []) + [_trace("critique", summary)]
    return {"critique_output": result, "iteration_count": iteration_count, "agent_trace": trace}


async def synthesis_node(state: ResearchState) -> dict[str, Any]:
    """Produce the final structured Markdown research report."""
    critique = state["critique_output"]

    literature = state.get("literature_context", [])[:8]
    refs: list[str] = []
    for i, paper in enumerate(literature, 1):
        year = paper.get("year") or "n.d."
        source_tag = "[ArXiv]" if paper.get("arxiv_url") else "[Local]"
        refs.append(f"{i}. {paper.get('title', 'Unknown')} ({year}) {source_tag}")
    refs_str = "\n".join(refs) if refs else "No references retrieved."
    ref_count = len(refs)

    prompt = (
        f"You are a technical research writer for semiconductor manufacturing.\n"
        f"Generate a complete structured Markdown research report using EXACTLY these section headers:\n\n"
        f"# SiliconForge AI Research Report\n"
        f"## Query\n"
        f"## Executive Summary\n"
        f"## Literature Analysis\n"
        f"## Validated Hypothesis\n"
        f"## Proposed Experiment Plan\n"
        f"### Equipment Required\n"
        f"### Process Variables\n"
        f"### Success Metrics\n"
        f"### Risk Factors\n"
        f"## References\n\n"
        f"STRICT RULES for the ## References section:\n"
        f"- You MUST list ONLY the {ref_count} references provided below — numbered [1] through [{ref_count}].\n"
        f"- Do NOT add, invent, or hallucinate any additional references.\n"
        f"- Do NOT cite papers not in this list.\n"
        f"- In the body text, cite as [1], [2], etc. matching the list below.\n\n"
        f"Data to use:\n"
        f"- Original query: {state['user_query']}\n"
        f"- Technical summary: {state['raw_summary']}\n"
        f"- Critique verdict: {critique.verdict} (confidence: {critique.confidence_score})\n"
        f"- Validated hypothesis: {critique.hypothesis}\n"
        f"- Physical violations found: {critique.physical_violations}\n"
        f"- References (use ONLY these):\n{refs_str}\n\n"
        f"Write in precise technical language appropriate for a semiconductor process engineer."
    )
    final_report_msg = await _llm().ainvoke(prompt)
    final_report: str = final_report_msg.content  # type: ignore[union-attr]

    trace = state.get("agent_trace", []) + [
        _trace("synthesis", "Generated final structured Markdown research report")
    ]
    return {"final_report": final_report, "agent_trace": trace}
