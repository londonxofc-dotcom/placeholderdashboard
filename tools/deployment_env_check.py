"""Non-secret deployment environment readiness checker."""

from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass
from typing import Mapping


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
        if configured:
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
    return any(row["status"] == "missing" for row in rows)


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
