"""ToolService registry alignment tests."""

from backend.services.tool_service import ToolService


def test_tool_service_exposes_reviewer_allowed_tools():
    service = ToolService()

    expected_tools = [
        "text_generator",
        "scheduler",
        "search",
        "summarizer",
        "read_file",
        "write_file",
        "search_knowledge",
        "web_search",
        "run_query",
        "send_notification",
    ]

    for tool_name in expected_tools:
        assert service.get_tool(tool_name) is not None, (
            f"ToolService missing reviewer-allowed tool: {tool_name}"
        )
