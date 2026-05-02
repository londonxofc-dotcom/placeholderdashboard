"""Deployment decision record completeness checker."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DECISION_RECORD = ROOT / "docs" / "DEPLOYMENT_DECISION_RECORD.md"
UNRESOLVED_PATTERN = re.compile(r"\bTBD\b", re.IGNORECASE)
SCANNED_SECTIONS = {
    "Status",
    "Hosting",
    "Runtime URLs",
    "Required Environment",
    "Access And Safety",
    "Decision Log",
}


@dataclass(frozen=True)
class UnresolvedDecision:
    line_number: int
    section: str
    text: str


def find_unresolved_decisions(text: str) -> list[UnresolvedDecision]:
    section = "Document"
    unresolved: list[UnresolvedDecision] = []
    for line_number, line in enumerate(text.splitlines(), start=1):
        stripped = line.strip()
        if stripped.startswith("## "):
            section = stripped.lstrip("#").strip()
        if section in SCANNED_SECTIONS and UNRESOLVED_PATTERN.search(stripped):
            unresolved.append(
                UnresolvedDecision(
                    line_number=line_number,
                    section=section,
                    text=stripped,
                )
            )
    return unresolved


def render_report(
    unresolved: list[UnresolvedDecision],
    *,
    path: Path,
) -> str:
    lines = [f"Deployment decision check: {path}"]
    if not unresolved:
        lines.append("- status: complete")
        return "\n".join(lines)

    lines.append("- status: incomplete")
    for item in unresolved:
        lines.append(
            f"- line {item.line_number} [{item.section}]: {item.text}"
        )
    return "\n".join(lines)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fail if the deployment decision record still has TBD values."
    )
    parser.add_argument(
        "--path",
        default=str(DEFAULT_DECISION_RECORD),
        help="Path to deployment decision record markdown.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    path = Path(args.path)
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"Deployment decision check failed: {exc}", file=sys.stderr)
        return 2

    unresolved = find_unresolved_decisions(text)
    print(render_report(unresolved, path=path))
    return 1 if unresolved else 0


if __name__ == "__main__":
    raise SystemExit(main())
