"""Local deployment preflight runner.

This script wraps the existing verification commands from AGENTS.md and
docs/DEPLOYMENT_GUIDE.md. It does not create deployment config, start servers,
or read secrets.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class Step:
    name: str
    command: tuple[str, ...]


def build_steps(
    *,
    include_backend: bool = True,
    include_ui: bool = True,
    skip_ui_build: bool = False,
) -> list[Step]:
    steps: list[Step] = []
    if include_backend:
        steps.append(
            Step(
                "backend tests",
                (sys.executable, "-m", "pytest", "tests/", "-v"),
            )
        )
    if include_ui:
        steps.append(
            Step(
                "ui typecheck",
                ("npm", "--prefix", "ui", "run", "typecheck"),
            )
        )
        if not skip_ui_build:
            steps.append(
                Step(
                    "ui build",
                    ("npm", "--prefix", "ui", "run", "build"),
                )
            )
        steps.append(
            Step(
                "ui tests",
                ("npm", "--prefix", "ui", "test"),
            )
        )
    return steps


def run_step(step: Step) -> int:
    print(f"\n==> {step.name}")
    print("$ " + " ".join(step.command))
    completed = subprocess.run(step.command, cwd=ROOT, check=False)
    return completed.returncode


def git_status_for(paths: list[str]) -> str:
    completed = subprocess.run(
        ("git", "status", "--short", *paths),
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    return completed.stdout.strip()


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run Mission Control local deployment preflight checks."
    )
    parser.add_argument(
        "--backend-only",
        action="store_true",
        help="Run backend tests only.",
    )
    parser.add_argument(
        "--ui-only",
        action="store_true",
        help="Run UI checks only.",
    )
    parser.add_argument(
        "--skip-ui-build",
        action="store_true",
        help="Skip npm --prefix ui run build.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or [])
    if args.backend_only and args.ui_only:
        print("Choose at most one of --backend-only or --ui-only.", file=sys.stderr)
        return 2

    include_backend = not args.ui_only
    include_ui = not args.backend_only
    steps = build_steps(
        include_backend=include_backend,
        include_ui=include_ui,
        skip_ui_build=args.skip_ui_build,
    )

    for step in steps:
        code = run_step(step)
        if code != 0:
            print(f"\nPreflight failed at: {step.name}", file=sys.stderr)
            return code

    if include_ui and not args.skip_ui_build:
        churn = git_status_for(["ui/next-env.d.ts"])
        if churn:
            print(
                "\nPreflight failed: ui/next-env.d.ts changed during build. "
                "Restore generated churn before committing.",
                file=sys.stderr,
            )
            print(churn, file=sys.stderr)
            return 1

    print("\nPreflight passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
