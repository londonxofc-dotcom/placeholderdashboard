"""HTTP probe checker for deployed Mission Control backends."""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from typing import Callable
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import urlopen


PROBES = ("/health", "/status", "/ready")
EXPECTED_STATUSES = {
    "/health": "ok",
    "/status": "ok",
    "/ready": "ready",
}


@dataclass(frozen=True)
class ProbeResult:
    path: str
    status_code: int | None
    status: str
    ok: bool


UrlOpen = Callable[[str, float], object]


def normalize_base_url(base_url: str) -> str:
    return base_url.rstrip("/") + "/"


def has_api_path(base_url: str) -> bool:
    parsed = urlparse(base_url)
    path_parts = [part for part in parsed.path.split("/") if part]
    return "api" in path_parts


def probe_url(
    base_url: str,
    path: str,
    *,
    timeout: float,
    opener: UrlOpen = urlopen,
) -> ProbeResult:
    url = urljoin(normalize_base_url(base_url), path.lstrip("/"))
    try:
        with opener(url, timeout) as response:
            status_code = response.getcode()
            raw = response.read()
    except HTTPError as exc:
        status_code = exc.code
        raw = exc.read()
    except (TimeoutError, URLError, OSError):
        return ProbeResult(path=path, status_code=None, status="unreachable", ok=False)

    status_value = "unknown"
    try:
        payload = json.loads(raw.decode("utf-8"))
        if isinstance(payload, dict):
            status_value = str(payload.get("status", "unknown"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        status_value = "invalid_json"

    return ProbeResult(
        path=path,
        status_code=status_code,
        status=status_value,
        ok=200 <= status_code < 300,
    )


def run_probes(
    base_url: str,
    *,
    timeout: float,
    opener: UrlOpen = urlopen,
) -> list[ProbeResult]:
    return [
        probe_url(base_url, path, timeout=timeout, opener=opener)
        for path in PROBES
    ]


def probe_passes_policy(
    result: ProbeResult,
    *,
    allow_degraded_ready: bool = False,
) -> bool:
    expected_status = EXPECTED_STATUSES.get(result.path)
    if result.ok and (expected_status is None or result.status == expected_status):
        return True
    return (
        allow_degraded_ready
        and result.path == "/ready"
        and result.status_code == 503
        and result.status == "degraded"
    )


def render_results(
    results: list[ProbeResult],
    *,
    allow_degraded_ready: bool = False,
) -> str:
    lines = ["Deployment probe check"]
    for result in results:
        code = result.status_code if result.status_code is not None else "n/a"
        verdict = (
            "ok"
            if probe_passes_policy(
                result,
                allow_degraded_ready=allow_degraded_ready,
            )
            else "fail"
        )
        lines.append(f"- {result.path}: {verdict} http={code} status={result.status}")
    return "\n".join(lines)


def passes_probe_policy(
    results: list[ProbeResult],
    *,
    allow_degraded_ready: bool = False,
) -> bool:
    for result in results:
        if probe_passes_policy(
            result,
            allow_degraded_ready=allow_degraded_ready,
        ):
            continue
        return False
    return True


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Check Mission Control backend health/status/readiness probes."
    )
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000",
        help="Backend base URL, without /api.",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=3.0,
        help="Per-probe timeout in seconds.",
    )
    parser.add_argument(
        "--allow-degraded-ready",
        action="store_true",
        help=(
            "Treat /ready HTTP 503 with status=degraded as acceptable for "
            "pre-launch host reachability checks."
        ),
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    if has_api_path(args.base_url):
        print(
            "Deployment probe check failed: --base-url must be the backend "
            "base URL without /api.",
            file=sys.stderr,
        )
        return 2
    results = run_probes(args.base_url, timeout=args.timeout)
    print(
        render_results(
            results,
            allow_degraded_ready=args.allow_degraded_ready,
        )
    )
    return 0 if passes_probe_policy(
        results,
        allow_degraded_ready=args.allow_degraded_ready,
    ) else 1


if __name__ == "__main__":
    raise SystemExit(main())
