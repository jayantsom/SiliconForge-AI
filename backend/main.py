from __future__ import annotations

import json
import logging
import uuid
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sse_starlette.sse import EventSourceResponse

from backend.agents.graph import compiled_graph
from backend.agents.state import ResearchState
from backend.config import settings
from backend.database import engine, get_history, init_db, save_session, update_session
from backend.schemas import (
    HealthResponse,
    ResearchRequest,
    ResearchResponse,
    SessionSummary,
    TraceEventSchema,
)
from backend.tools.literature import _get_client, init_literature_store

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await init_db()
    init_literature_store()
    yield


app = FastAPI(title="SiliconForge AI", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/v1/research/start", response_model=ResearchResponse)
async def start_research(body: ResearchRequest) -> ResearchResponse:
    session_id = body.session_id or str(uuid.uuid4())
    await save_session(session_id, body.query)

    initial_state: ResearchState = {
        "session_id": session_id,
        "user_query": body.query,
        "plan": [],
        "literature_context": [],
        "raw_summary": "",
        "critique_output": None,  # type: ignore[assignment]
        "final_report": "",
        "iteration_count": 0,
        "agent_trace": [],
    }

    config = {"configurable": {"thread_id": session_id}}
    try:
        final_state: dict[str, Any] = await compiled_graph.ainvoke(initial_state, config=config)
    except Exception as exc:
        logger.error("Graph execution failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    trace_dicts = [t.model_dump() for t in final_state.get("agent_trace", [])]
    await update_session(session_id, final_state.get("final_report", ""), trace_dicts)

    return ResearchResponse(
        session_id=session_id,
        final_report=final_state.get("final_report", ""),
        agent_trace=[TraceEventSchema(**t) for t in trace_dicts],
        iteration_count=final_state.get("iteration_count", 0),
    )


@app.get("/api/v1/research/stream/{session_id}")
async def stream_research(
    session_id: str,
    query: str = Query(..., description="Research query string"),
) -> EventSourceResponse:
    async def event_generator() -> AsyncGenerator[dict[str, str], None]:
        initial_state: ResearchState = {
            "session_id": session_id,
            "user_query": query,
            "plan": [],
            "literature_context": [],
            "raw_summary": "",
            "critique_output": None,  # type: ignore[assignment]
            "final_report": "",
            "iteration_count": 0,
            "agent_trace": [],
        }
        await save_session(session_id, query)
        config = {"configurable": {"thread_id": session_id}}

        accumulated_state: dict[str, Any] = dict(initial_state)
        try:
            async for chunk in compiled_graph.astream(initial_state, config=config):
                for node_name, node_output in chunk.items():
                    accumulated_state.update(node_output)
                    trace = accumulated_state.get("agent_trace", [])
                    last = trace[-1] if trace else None
                    summary = (last.summary if hasattr(last, "summary") else str(last)) if last else f"{node_name} completed"
                    timestamp = (last.timestamp if hasattr(last, "timestamp") else "") if last else ""
                    payload = json.dumps({
                        "event": "node_complete",
                        "node": node_name,
                        "summary": summary,
                        "timestamp": timestamp,
                    })
                    yield {"data": payload}

        except Exception as exc:
            logger.error("Streaming failed: %s", exc)
            yield {"data": json.dumps({"event": "error", "message": str(exc)})}
            return

        report = accumulated_state.get("final_report", "")
        trace_dicts = [
            (t.model_dump() if hasattr(t, "model_dump") else dict(t))
            for t in accumulated_state.get("agent_trace", [])
        ]
        await update_session(session_id, report, trace_dicts)
        yield {
            "data": json.dumps({
                "event": "complete",
                "session_id": session_id,
                "final_report": report,
            })
        }

    return EventSourceResponse(event_generator())


@app.get("/api/v1/research/history", response_model=list[SessionSummary])
async def get_research_history() -> list[SessionSummary]:
    rows = await get_history(limit=20)
    return [SessionSummary(**r) for r in rows]


@app.get("/api/v1/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    ollama_ok = False
    chromadb_ok = False
    postgres_ok = False

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{settings.ollama_base_url}/api/tags")
            ollama_ok = resp.status_code == 200
    except Exception:
        pass

    try:
        _get_client().heartbeat()
        chromadb_ok = True
    except Exception:
        pass

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        postgres_ok = True
    except Exception:
        pass

    return HealthResponse(status="ok", ollama=ollama_ok, chromadb=chromadb_ok, postgres=postgres_ok)
