from __future__ import annotations

from pydantic import BaseModel


class ResearchRequest(BaseModel):
    query: str
    session_id: str | None = None


class TraceEventSchema(BaseModel):
    node: str
    timestamp: str
    summary: str


class ResearchResponse(BaseModel):
    session_id: str
    final_report: str
    agent_trace: list[TraceEventSchema]
    iteration_count: int


class SessionSummary(BaseModel):
    session_id: str
    user_query: str
    created_at: str
    status: str


class HealthResponse(BaseModel):
    status: str
    ollama: bool
    chromadb: bool
    postgres: bool


