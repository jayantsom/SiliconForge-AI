from __future__ import annotations

import json
import logging

import mcp.server.stdio
from mcp.server import Server
from mcp.types import Tool, TextContent

from backend.tools.literature import init_literature_store, query_local_literature

logger = logging.getLogger(__name__)

server = Server("literature-server")
init_literature_store()


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="query_semiconductor_literature",
            description="Query the local ChromaDB semiconductor literature vector store",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Semantic search query"},
                    "limit": {"type": "integer", "description": "Max results", "default": 3},
                },
                "required": ["query"],
            },
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "query_semiconductor_literature":
        query = arguments["query"]
        limit = arguments.get("limit", 3)
        results = query_local_literature(query=query, limit=limit)
        return [TextContent(type="text", text=json.dumps(results))]
    raise ValueError(f"Unknown tool: {name}")


async def main() -> None:
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
