from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import chromadb
from chromadb.config import Settings as ChromaSettings

from backend.config import settings

logger = logging.getLogger(__name__)

_chroma_client: chromadb.PersistentClient | None = None
_collection: chromadb.Collection | None = None

_COLLECTION_NAME = "semiconductor_literature"
_DATA_PATH = Path(__file__).parent.parent.parent / "data" / "sample_papers.json"


def _get_client() -> chromadb.PersistentClient:
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _chroma_client


def init_literature_store() -> None:
    # Loads sample_papers.json into ChromaDB only if the collection is empty
    global _collection
    client = _get_client()
    _collection = client.get_or_create_collection(name=_COLLECTION_NAME)

    if _collection.count() > 0:
        logger.info("Literature store already populated with %d documents", _collection.count())
        return

    papers: list[dict[str, Any]] = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
    _collection.add(
        ids=[p["id"] for p in papers],
        documents=[p["abstract"] for p in papers],
        metadatas=[
            {
                "title": p["title"],
                "domain": p["domain"],
                "year": p["year"],
                "keywords": ", ".join(p["keywords"]),
            }
            for p in papers
        ],
    )
    logger.info("Loaded %d papers into ChromaDB", len(papers))


def query_local_literature(query: str, limit: int = 3) -> list[dict[str, Any]]:
    """Run a ChromaDB similarity search and return structured result dicts."""
    global _collection
    if _collection is None:
        init_literature_store()
    if _collection is None:
        raise RuntimeError(
            "ChromaDB collection is not initialised. "
            "Check that CHROMA_PERSIST_DIR is writable and sample_papers.json exists."
        )

    results = _collection.query(query_texts=[query], n_results=min(limit, _collection.count()))
    output: list[dict[str, Any]] = []
    for i, doc in enumerate(results["documents"][0]):
        meta = results["metadatas"][0][i]
        output.append(
            {
                "title": meta.get("title", ""),
                "abstract": doc,
                "domain": meta.get("domain", ""),
                "year": meta.get("year", 0),
            }
        )
    return output
