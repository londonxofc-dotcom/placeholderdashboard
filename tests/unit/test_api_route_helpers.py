import sys
from unittest.mock import MagicMock, patch


def _get_routes():
    if "backend.api.routes" not in sys.modules:
        mock_engine = MagicMock()
        with patch("sqlalchemy.create_engine", return_value=mock_engine):
            import backend.api.routes  # noqa: F401

    from backend.api import routes

    return routes


def test_tasks_by_id_builds_constant_time_lookup_without_copying_tasks():
    routes = _get_routes()
    task = {"id": "task-1", "status": "pending_approval"}

    indexed = routes._tasks_by_id([task])

    assert indexed == {"task-1": task}
    indexed["task-1"]["status"] = "approved"
    assert task["status"] == "approved"


def test_tasks_by_id_uses_last_duplicate_id_like_dict_comprehension():
    routes = _get_routes()
    first = {"id": "task-1", "status": "pending_approval"}
    second = {"id": "task-1", "status": "approved"}

    indexed = routes._tasks_by_id([first, second])

    assert indexed["task-1"] is second
