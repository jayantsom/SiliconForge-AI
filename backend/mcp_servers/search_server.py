from __future__ import annotations

import json
import logging

import mcp.server.stdio
from mcp.server import Server
from mcp.types import Tool, TextContent

from backend.tools.search import fetch_arxiv_papers

logger = logging.getLogger(__name__)

server = Server("search-server")


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="search_arxiv_papers",
            description="Search the ArXiv public API for semiconductor research papers",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query string"},
                    "max_results": {"type": "integer", "description": "Max papers to return", "default": 5},
                },
                "required": ["query"],
            },
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "search_arxiv_papers":
        query = arguments["query"]
        max_results = arguments.get("max_results", 5)
        results = fetch_arxiv_papers(query=query, max_results=max_results)
        return [TextContent(type="text", text=json.dumps(results))]
    raise ValueError(f"Unknown tool: {name}")


async def main() -> None:
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
