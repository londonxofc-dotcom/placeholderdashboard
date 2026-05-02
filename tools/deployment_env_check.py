"""Non-secret deployment environment readiness checker."""

from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass
from typing import Mapping
from urllib.parse import urlparse


PLACEHOLDER_VALUES = {
    "",
    "your-api-key-here",
    "changeme",
    "change-me",
    "placeholder",
}


@dataclass(frozen=True)
class EnvRequirement:
    name: str
    production_required: bool
    local_required: bool = False
    allow_placeholder: bool = False


INVALID_PRODUCTION_VALUES = {
    "ALLOWED_ORIGINS": {"*"},
}


REQUIREMENTS = (
    EnvRequirement("DATABASE_URL", production_required=True, local_required=True),
    EnvRequirement("ANTHROPIC_API_KEY", production_required=True),
    EnvRequirement("ALLOWED_ORIGINS", production_required=True),
    EnvRequirement("NEXT_PUBLIC_API_URL", production_required=True),
)


def is_configured(value: str | None, *, allow_placeholder: bool = False) -> bool:
    if value is None:
        return False
    normalized = value.strip()
    if allow_placeholder:
        return bool(normalized)
    return normalized.lower() not in PLACEHOLDER_VALUES


def is_valid_production_value(name: str, value: str | None) -> bool:
    if value is None:
        return True
    if name == "NEXT_PUBLIC_API_URL":
        return is_http_url(value) and has_api_path(value)
    if name == "ALLOWED_ORIGINS":
        return allowed_origins_are_valid(value)
    invalid_values = INVALID_PRODUCTION_VALUES.get(name, set())
    normalized_values = {
        item.strip().lower()
        for item in value.split(",")
        if item.strip()
    }
    return normalized_values.isdisjoint(invalid_values)


def has_api_path(value: str) -> bool:
    parsed = urlparse(value)
    path_parts = [part for part in parsed.path.split("/") if part]
    return bool(path_parts) and path_parts[-1] == "api"


def is_http_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def is_origin(value: str) -> bool:
    parsed = urlparse(value)
    return (
        parsed.scheme in {"http", "https"}
        and bool(parsed.netloc)
        and parsed.path in {"", "/"}
        and not parsed.params
        and not parsed.query
        and not parsed.fragment
    )


def allowed_origins_are_valid(value: str) -> bool:
    origins = [item.strip() for item in value.split(",") if item.strip()]
    return bool(origins) and all(is_origin(origin) for origin in origins)


def check_environment(
    env: Mapping[str, str | None],
    *,
    production: bool,
) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for requirement in REQUIREMENTS:
        required = (
            requirement.production_required
            if production
            else requirement.local_required
        )
        configured = is_configured(
            env.get(requirement.name),
            allow_placeholder=requirement.allow_placeholder,
        )
        if configured and production and not is_valid_production_value(
            requirement.name,
            env.get(requirement.name),
        ):
            status = "invalid"
        elif configured:
            status = "ok"
        elif required:
            status = "missing"
        else:
            status = "optional"
        rows.append(
            {
                "name": requirement.name,
                "status": status,
                "required": "yes" if required else "no",
            }
        )
    return rows


def has_blockers(rows: list[dict[str, str]]) -> bool:
    return any(row["status"] in {"missing", "invalid"} for row in rows)


def render_report(rows: list[dict[str, str]], *, production: bool) -> str:
    profile = "production" if production else "local"
    lines = [f"Deployment environment check ({profile})"]
    for row in rows:
        lines.append(
            f"- {row['name']}: {row['status']} (required: {row['required']})"
        )
    return "\n".join(lines)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Check deployment env vars without printing secret values."
    )
    parser.add_argument(
        "--production",
        action="store_true",
        help="Require production deployment variables.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    rows = check_environment(os.environ, production=args.production)
    print(render_report(rows, production=args.production))
    return 1 if has_blockers(rows) else 0


if __name__ == "__main__":
    raise SystemExit(main())
