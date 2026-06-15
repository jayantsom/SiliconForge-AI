from __future__ import annotations

import logging
import xml.etree.ElementTree as ET
from typing import Any

import httpx

from backend.config import settings

logger = logging.getLogger(__name__)

_ARXIV_API = "https://export.arxiv.org/api/query"
_ATOM_NS = "http://www.w3.org/2005/Atom"


async def fetch_arxiv_papers(query: str, max_results: int | None = None) -> list[dict[str, Any]]:
    """Query the ArXiv public REST API asynchronously. Never raises — returns [] on failure."""
    n = max_results if max_results is not None else settings.arxiv_max_results
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(
                _ARXIV_API,
                params={"search_query": f"all:{query}", "start": 0, "max_results": n},
            )
            response.raise_for_status()
            return _parse_arxiv_response(response.text)
    except Exception as exc:
        logger.error("ArXiv fetch failed: %s", exc)
        return []


def _parse_arxiv_response(xml_text: str) -> list[dict[str, Any]]:
    """Parse Atom XML and extract title, abstract, authors, published date, and URL."""
    root = ET.fromstring(xml_text)
    entries = root.findall(f"{{{_ATOM_NS}}}entry")
    results: list[dict[str, Any]] = []
    for entry in entries:
        title_el = entry.find(f"{{{_ATOM_NS}}}title")
        summary_el = entry.find(f"{{{_ATOM_NS}}}summary")
        published_el = entry.find(f"{{{_ATOM_NS}}}published")
        id_el = entry.find(f"{{{_ATOM_NS}}}id")
        author_els = entry.findall(f"{{{_ATOM_NS}}}author")

        authors = [
            (a.find(f"{{{_ATOM_NS}}}name") or ET.Element("name")).text or ""
            for a in author_els
        ]
        published = (published_el.text or "").strip() if published_el is not None else ""
        results.append(
            {
                "title": (title_el.text or "").strip() if title_el is not None else "",
                "abstract": (summary_el.text or "").strip() if summary_el is not None else "",
                "authors": authors,
                "published": published,
                # Extract year from ISO date string for consistent display
                "year": int(published[:4]) if len(published) >= 4 else 0,
                "arxiv_url": (id_el.text or "").strip() if id_el is not None else "",
            }
        )
    return results
