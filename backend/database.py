from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy import String, Text, DateTime

from backend.config import settings

engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class ResearchSession(Base):
    __tablename__ = "research_sessions"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    user_query: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="running")
    final_report: Mapped[str | None] = mapped_column(Text, nullable=True)
    agent_trace: Mapped[list[dict[str, Any]] | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


async def init_db() -> None:
    # Creates all tables on startup if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def save_session(session_id: str, query: str) -> None:
    # Inserts a new session record with status 'running'
    async with AsyncSessionLocal() as session:
        record = ResearchSession(session_id=session_id, user_query=query, status="running")
        session.add(record)
        await session.commit()


async def update_session(session_id: str, report: str, trace: list[dict[str, Any]]) -> None:
    # Updates the session with final report and marks it complete
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("SELECT id FROM research_sessions WHERE session_id = :sid"),
            {"sid": session_id},
        )
        row = result.fetchone()
        if row is None:
            return
        await session.execute(
            text(
                "UPDATE research_sessions SET status='complete', final_report=:report, "
                "agent_trace=cast(:trace as jsonb), updated_at=NOW() WHERE session_id=:sid"
            ),
            {"report": report, "trace": json.dumps(trace), "sid": session_id},
        )
        await session.commit()


async def get_history(limit: int = 20) -> list[dict[str, Any]]:
    # Returns the most recent completed sessions ordered by creation time
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text(
                "SELECT session_id, user_query, created_at, status FROM research_sessions "
                "WHERE status='complete' ORDER BY created_at DESC LIMIT :lim"
            ),
            {"lim": limit},
        )
        rows = result.fetchall()
        return [
            {
                "session_id": r.session_id,
                "user_query": r.user_query,
                "created_at": r.created_at.isoformat(),
                "status": r.status,
            }
            for r in rows
        ]
