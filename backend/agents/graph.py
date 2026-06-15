from __future__ import annotations

from langgraph.graph import END, START, StateGraph
from langgraph.checkpoint.memory import MemorySaver

from backend.agents.nodes import critique_node, planner_node, retrieval_node, synthesis_node
from backend.agents.state import ResearchState


def route_after_critique(state: ResearchState) -> str:
    # Routes back to planner on failure if under iteration limit, otherwise proceeds to synthesis
    if (
        state["critique_output"].verdict == "fail"
        and state["iteration_count"] < 2
    ):
        return "planner"
    return "synthesis"


def build_graph() -> StateGraph:
    graph = StateGraph(ResearchState)

    graph.add_node("planner", planner_node)
    graph.add_node("retrieval", retrieval_node)
    graph.add_node("critique", critique_node)
    graph.add_node("synthesis", synthesis_node)

    graph.add_edge(START, "planner")
    graph.add_edge("planner", "retrieval")
    graph.add_edge("retrieval", "critique")
    graph.add_conditional_edges("critique", route_after_critique, {"planner": "planner", "synthesis": "synthesis"})
    graph.add_edge("synthesis", END)

    return graph


# Compiled graph with MemorySaver for per-session isolated memory
checkpointer = MemorySaver()
compiled_graph = build_graph().compile(checkpointer=checkpointer)
