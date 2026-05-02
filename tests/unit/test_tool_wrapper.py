"""Unit tests for ToolWrapper memory-boundary behavior."""

from __future__ import annotations

import pytest

from backend.agents.tool_wrapper import ToolWrapper
from backend.services.cost_service import CostService
from backend.services.memory_service import MemoryService
from backend.services.tool_service import ToolService


@pytest.mark.asyncio
async def test_tool_wrapper_namespaces_task_memory_write_through_isolation_boundary():
    memory_service = MemoryService()
    wrapper = ToolWrapper(
        tool_service=ToolService(),
        cost_service=CostService(),
        memory_service=memory_service,
    )

    success, result = await wrapper.execute(
        mission_id="m_wrapper_iso",
        tool_name="read_file",
        tool_input={"path": "brief.txt"},
        mode="batman",
        approver_id="operator",
        task_id="t_wrap",
    )

    assert success is True
    assert result["tool"] == "read_file"

    raw_entry = memory_service.retrieve("m_wrapper_iso", "task_t_wrap_result")
    scoped_entry = memory_service.retrieve(
        "m_wrapper_iso",
        "m_wrapper_iso::task_t_wrap_result",
    )

    assert raw_entry is None
    assert scoped_entry is not None
    assert scoped_entry["tool"] == "read_file"
