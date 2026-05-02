import sys
from unittest.mock import MagicMock, patch

import httpx


def _get_app():
    if "backend.main" not in sys.modules:
        mock_engine = MagicMock()
        mock_engine.connect.return_value.__enter__ = MagicMock(return_value=MagicMock())
        mock_engine.connect.return_value.__exit__ = MagicMock(return_value=False)
        with patch("sqlalchemy.create_engine", return_value=mock_engine), patch(
            "backend.db.session.init_db", return_value=None
        ):
            import backend.main  # noqa: F401

    from backend.main import app

    return app


def test_parse_allowed_origins_strips_whitespace_and_empty_entries():
    _get_app()
    from backend.main import _parse_allowed_origins

    assert _parse_allowed_origins(
        " https://cockpit.example.com,https://admin.example.com, "
    ) == [
        "https://cockpit.example.com",
        "https://admin.example.com",
    ]


def test_parse_allowed_origins_falls_back_to_localhost():
    _get_app()
    from backend.main import _parse_allowed_origins

    assert _parse_allowed_origins(" , ") == ["http://localhost:3000"]


def test_parse_allowed_origins_ignores_wildcard_entries():
    _get_app()
    from backend.main import _parse_allowed_origins

    assert _parse_allowed_origins(
        "*, https://cockpit.example.com, * "
    ) == ["https://cockpit.example.com"]


def test_parse_allowed_origins_falls_back_when_only_wildcard():
    _get_app()
    from backend.main import _parse_allowed_origins

    assert _parse_allowed_origins("*") == ["http://localhost:3000"]


async def test_health_reports_current_phase_without_dependency_checks():
    app = _get_app()
    transport = httpx.ASGITransport(app=app)  # type: ignore[arg-type]

    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")

    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["version"] == "0.0.1"
    assert body["phase"] == "Phase 5 - Polish & Launch"


async def test_status_reports_runtime_snapshot_without_dependency_checks():
    app = _get_app()
    transport = httpx.ASGITransport(app=app)  # type: ignore[arg-type]

    with patch("backend.main.engine.connect") as connect, patch.dict(
        "os.environ", {"ENV": "test"}, clear=False
    ):
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/status")

    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["version"] == "0.0.1"
    assert body["phase"] == "Phase 5 - Polish & Launch"
    assert body["environment"] == "test"
    assert body["uptime_seconds"] >= 0
    assert "started_at" in body
    assert body["probes"] == {
        "liveness": "/health",
        "status": "/status",
        "readiness": "/ready",
    }
    connect.assert_not_called()


async def test_ready_reports_ready_when_database_check_passes():
    app = _get_app()
    connection = MagicMock()
    connect = MagicMock()
    connect.return_value.__enter__.return_value = connection
    connect.return_value.__exit__.return_value = False

    with patch("backend.main.engine.connect", connect), patch.dict(
        "os.environ",
        {"ENV": "test", "ANTHROPIC_API_KEY": "test-key"},
        clear=False,
    ):
        transport = httpx.ASGITransport(app=app)  # type: ignore[arg-type]
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/ready")

    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ready"
    assert body["environment"] == "test"
    assert body["checks"]["database"] == {"status": "ok"}
    assert body["checks"]["anthropic_api_key"] == {"status": "ok"}
    assert body["checks"]["api_router"] == {"status": "ok", "prefix": "/api"}
    assert body["phase"] == "Phase 5 - Polish & Launch"
    assert "checked_at" in body
    connection.execute.assert_called_once()


async def test_ready_reports_degraded_without_leaking_database_details():
    app = _get_app()
    connect = MagicMock(side_effect=RuntimeError("password=secret host=prod"))

    with patch("backend.main.engine.connect", connect):
        transport = httpx.ASGITransport(app=app)  # type: ignore[arg-type]
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/ready")

    assert resp.status_code == 503
    body = resp.json()
    assert body["status"] == "degraded"
    assert body["checks"]["database"] == {
        "status": "error",
        "message": "RuntimeError",
    }
    assert body["checks"]["anthropic_api_key"]["status"] in {"ok", "missing"}
    assert "secret" not in str(body).lower()


async def test_ready_reports_degraded_when_anthropic_key_is_missing():
    app = _get_app()
    connection = MagicMock()
    connect = MagicMock()
    connect.return_value.__enter__.return_value = connection
    connect.return_value.__exit__.return_value = False

    with patch("backend.main.engine.connect", connect), patch.dict(
        "os.environ", {"ANTHROPIC_API_KEY": ""}, clear=False
    ):
        transport = httpx.ASGITransport(app=app)  # type: ignore[arg-type]
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/ready")

    assert resp.status_code == 503
    body = resp.json()
    assert body["status"] == "degraded"
    assert body["checks"]["database"] == {"status": "ok"}
    assert body["checks"]["anthropic_api_key"] == {
        "status": "missing",
        "message": "ANTHROPIC_API_KEY is not configured",
    }


async def test_ready_reports_degraded_when_anthropic_key_is_placeholder():
    app = _get_app()
    connection = MagicMock()
    connect = MagicMock()
    connect.return_value.__enter__.return_value = connection
    connect.return_value.__exit__.return_value = False

    with patch("backend.main.engine.connect", connect), patch.dict(
        "os.environ", {"ANTHROPIC_API_KEY": "your-api-key-here"}, clear=False
    ):
        transport = httpx.ASGITransport(app=app)  # type: ignore[arg-type]
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/ready")

    assert resp.status_code == 503
    body = resp.json()
    assert body["status"] == "degraded"
    assert body["checks"]["database"] == {"status": "ok"}
    assert body["checks"]["anthropic_api_key"] == {
        "status": "missing",
        "message": "ANTHROPIC_API_KEY is not configured",
    }
