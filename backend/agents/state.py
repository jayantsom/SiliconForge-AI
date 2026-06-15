from __future__ import annotations

from typing import Literal

from pydantic import BaseModel
from typing_extensions import TypedDict


class CritiqueResult(BaseModel):
    verdict: Literal["pass", "fail"]
    hypothesis: str
    failure_reason: str | None = None
    confidence_score: float
    physical_violations: list[str]


class TraceEvent(BaseModel):
    node: str
    timestamp: str
    summary: str


class PlannerOutput(BaseModel):
    search_keywords: list[str]
    strategy_steps: list[str]


class ResearchState(TypedDict):
    session_id: str
    user_query: str
    plan: list[str]
    literature_context: list[dict]
    raw_summary: str
    critique_output: CritiqueResult
    final_report: str
    iteration_count: int
    agent_trace: list[TraceEvent]
