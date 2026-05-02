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
PROTECTED_TRACKED_FILES = ("current.md", "ui/next-env.d.ts")


@dataclass(frozen=True)
class Step:
    name: str
    command: tuple[str, ...]


def build_steps(
    *,
    include_backend: bool = True,
    include_ui: bool = True,
    skip_ui_build: bool = False,
    include_decision_check: bool = False,
    include_production_env_check: bool = False,
) -> list[Step]:
    steps: list[Step] = []
    if include_decision_check:
        steps.append(
            Step(
                "deployment decision check",
                (sys.executable, "tools/deployment_decision_check.py"),
            )
        )
    if include_production_env_check:
        steps.append(
            Step(
                "production environment check",
                (sys.executable, "tools/deployment_env_check.py", "--production"),
            )
        )
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


def protected_file_status() -> str:
    return git_status_for(list(PROTECTED_TRACKED_FILES))


def report_protected_file_churn(status: str) -> None:
    print(
        "\nPreflight failed: protected tracked files are dirty. "
        "Restore or intentionally scope them before deployment verification.",
        file=sys.stderr,
    )
    print(status, file=sys.stderr)


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
    parser.add_argument(
        "--include-decision-check",
        action="store_true",
        help="Fail if docs/DEPLOYMENT_DECISION_RECORD.md still has TBD values.",
    )
    parser.add_argument(
        "--include-production-env-check",
        action="store_true",
        help="Fail if production deployment environment variables are not ready.",
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
        include_decision_check=args.include_decision_check,
        include_production_env_check=args.include_production_env_check,
    )

    protected_status = protected_file_status()
    if protected_status:
        report_protected_file_churn(protected_status)
        return 1

    for step in steps:
        code = run_step(step)
        if code != 0:
            print(f"\nPreflight failed at: {step.name}", file=sys.stderr)
            return code

    protected_status = protected_file_status()
    if protected_status:
        report_protected_file_churn(protected_status)
        return 1

    print("\nPreflight passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
