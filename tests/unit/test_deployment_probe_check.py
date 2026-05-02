import json
from urllib.error import HTTPError, URLError

from tools import deployment_probe_check


class FakeResponse:
    def __init__(self, code: int, payload: dict[str, str]):
        self.code = code
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False

    def getcode(self):
        return self.code

    def read(self):
        return json.dumps(self.payload).encode("utf-8")

    def close(self):
        return None


def test_normalize_base_url_adds_trailing_slash():
    assert deployment_probe_check.normalize_base_url("https://api.example.com") == (
        "https://api.example.com/"
    )


def test_probe_url_reports_ok_json_status():
    def opener(url, timeout):
        assert url == "https://api.example.com/health"
        assert timeout == 1.5
        return FakeResponse(200, {"status": "ok"})

    result = deployment_probe_check.probe_url(
        "https://api.example.com",
        "/health",
        timeout=1.5,
        opener=opener,
    )

    assert result == deployment_probe_check.ProbeResult(
        path="/health",
        status_code=200,
        status="ok",
        ok=True,
    )


def test_probe_url_reports_http_error_without_leaking_body():
    def opener(url, timeout):
        raise HTTPError(
            url,
            503,
            "Service Unavailable",
            hdrs={},
            fp=FakeResponse(503, {"status": "degraded"}),
        )

    result = deployment_probe_check.probe_url(
        "https://api.example.com",
        "/ready",
        timeout=3,
        opener=opener,
    )

    assert result == deployment_probe_check.ProbeResult(
        path="/ready",
        status_code=503,
        status="degraded",
        ok=False,
    )


def test_probe_url_reports_unreachable():
    def opener(url, timeout):
        raise URLError("connection refused")

    result = deployment_probe_check.probe_url(
        "https://api.example.com",
        "/status",
        timeout=3,
        opener=opener,
    )

    assert result == deployment_probe_check.ProbeResult(
        path="/status",
        status_code=None,
        status="unreachable",
        ok=False,
    )


def test_run_probes_checks_all_probe_paths():
    seen: list[str] = []

    def opener(url, timeout):
        seen.append(url)
        return FakeResponse(200, {"status": "ok"})

    results = deployment_probe_check.run_probes(
        "https://api.example.com",
        timeout=3,
        opener=opener,
    )

    assert [result.path for result in results] == ["/health", "/status", "/ready"]
    assert seen == [
        "https://api.example.com/health",
        "https://api.example.com/status",
        "https://api.example.com/ready",
    ]
    assert all(result.ok for result in results)


def test_main_returns_failure_when_any_probe_fails(monkeypatch, capsys):
    monkeypatch.setattr(
        deployment_probe_check,
        "run_probes",
        lambda base_url, timeout: [
            deployment_probe_check.ProbeResult("/health", 200, "ok", True),
            deployment_probe_check.ProbeResult("/status", 200, "ok", True),
            deployment_probe_check.ProbeResult("/ready", 503, "degraded", False),
        ],
    )

    code = deployment_probe_check.main(["--base-url", "https://api.example.com"])

    assert code == 1
    assert "/ready: fail http=503 status=degraded" in capsys.readouterr().out


def test_main_returns_success_when_all_probes_pass(monkeypatch):
    monkeypatch.setattr(
        deployment_probe_check,
        "run_probes",
        lambda base_url, timeout: [
            deployment_probe_check.ProbeResult("/health", 200, "ok", True),
            deployment_probe_check.ProbeResult("/status", 200, "ok", True),
            deployment_probe_check.ProbeResult("/ready", 200, "ready", True),
        ],
    )

    assert deployment_probe_check.main([]) == 0
