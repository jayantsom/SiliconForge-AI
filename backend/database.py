from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import DateTime, String, Text, text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID

from backend.config import settings

logger = logging.getLogger(__name__)

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
    # Creates all tables on startup if they don't exist.
    # Gracefully skips if PostgreSQL is not reachable (e.g. local dev without Docker).
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables initialised successfully")
    except Exception as exc:
        logger.warning(
            "PostgreSQL unavailable — history persistence disabled. Reason: %s", exc
        )


async def save_session(session_id: str, query: str) -> None:
    try:
        async with AsyncSessionLocal() as session:
            record = ResearchSession(session_id=session_id, user_query=query, status="running")
            session.add(record)
            await session.commit()
    except Exception as exc:
        logger.warning("save_session skipped (DB unavailable?): %s", exc)


async def update_session(session_id: str, report: str, trace: list[dict[str, Any]]) -> None:
    try:
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
    except Exception as exc:
        logger.warning("update_session skipped (DB unavailable?): %s", exc)


async def get_history(limit: int = 20) -> list[dict[str, Any]]:
    try:
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
    except Exception as exc:
        logger.warning("get_history failed (DB unavailable?): %s", exc)
        return []
