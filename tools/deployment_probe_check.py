"""HTTP probe checker for deployed Mission Control backends."""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from typing import Callable
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import urlopen


PROBES = ("/health", "/status", "/ready")


@dataclass(frozen=True)
class ProbeResult:
    path: str
    status_code: int | None
    status: str
    ok: bool


UrlOpen = Callable[[str, float], object]


def normalize_base_url(base_url: str) -> str:
    return base_url.rstrip("/") + "/"


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


def render_results(results: list[ProbeResult]) -> str:
    lines = ["Deployment probe check"]
    for result in results:
        code = result.status_code if result.status_code is not None else "n/a"
        verdict = "ok" if result.ok else "fail"
        lines.append(f"- {result.path}: {verdict} http={code} status={result.status}")
    return "\n".join(lines)


def passes_probe_policy(
    results: list[ProbeResult],
    *,
    allow_degraded_ready: bool = False,
) -> bool:
    for result in results:
        if result.ok:
            continue
        if (
            allow_degraded_ready
            and result.path == "/ready"
            and result.status_code == 503
            and result.status == "degraded"
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
    results = run_probes(args.base_url, timeout=args.timeout)
    print(render_results(results))
    return 0 if passes_probe_policy(
        results,
        allow_degraded_ready=args.allow_degraded_ready,
    ) else 1


if __name__ == "__main__":
    raise SystemExit(main())
