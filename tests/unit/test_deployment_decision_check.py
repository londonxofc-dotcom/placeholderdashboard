from pathlib import Path

from tools import deployment_decision_check


def test_find_unresolved_decisions_tracks_section_and_line():
    text = """# Decision Record

Use TBD for unknown values.

## Status

- Decision state: TBD

## Hosting

| Backend host | TBD |
"""

    unresolved = deployment_decision_check.find_unresolved_decisions(text)

    assert unresolved == [
        deployment_decision_check.UnresolvedDecision(
            line_number=7,
            section="Status",
            text="- Decision state: TBD",
        ),
        deployment_decision_check.UnresolvedDecision(
            line_number=11,
            section="Hosting",
            text="| Backend host | TBD |",
        ),
    ]


def test_find_unresolved_decisions_is_case_insensitive_whole_word():
    text = "## Status\n\nstate: tbd\nword: notbd\n"

    unresolved = deployment_decision_check.find_unresolved_decisions(text)

    assert unresolved == [
        deployment_decision_check.UnresolvedDecision(
            line_number=3,
            section="Status",
            text="state: tbd",
        )
    ]


def test_render_report_for_complete_record():
    report = deployment_decision_check.render_report(
        [],
        path=Path("docs/DEPLOYMENT_DECISION_RECORD.md"),
    )

    assert report == (
        "Deployment decision check: docs/DEPLOYMENT_DECISION_RECORD.md\n"
        "- status: complete"
    )


def test_render_report_for_incomplete_record():
    report = deployment_decision_check.render_report(
        [
            deployment_decision_check.UnresolvedDecision(
                line_number=4,
                section="Status",
                text="- Decision state: TBD",
            )
        ],
        path=Path("docs/DEPLOYMENT_DECISION_RECORD.md"),
    )

    assert "- status: incomplete" in report
    assert "line 4 [Status]: unresolved" in report
    assert "- Decision state: TBD" not in report


def test_render_report_does_not_echo_decision_contents():
    report = deployment_decision_check.render_report(
        [
            deployment_decision_check.UnresolvedDecision(
                line_number=9,
                section="Required Environment",
                text="| `DATABASE_URL` | postgresql://user:secret@example/db | TBD |",
            )
        ],
        path=Path("docs/DEPLOYMENT_DECISION_RECORD.md"),
    )

    assert "postgresql://user:secret@example/db" not in report
    assert "TBD" not in report
    assert "line 9 [Required Environment]: unresolved" in report


def test_main_returns_failure_for_unresolved_record(tmp_path, capsys):
    record = tmp_path / "record.md"
    record.write_text("## Status\n\n- Decision state: TBD\n", encoding="utf-8")

    code = deployment_decision_check.main(["--path", str(record)])

    assert code == 1
    assert "- status: incomplete" in capsys.readouterr().out


def test_main_returns_success_for_complete_record(tmp_path, capsys):
    record = tmp_path / "record.md"
    record.write_text("## Status\n\n- Decision state: approved\n", encoding="utf-8")

    code = deployment_decision_check.main(["--path", str(record)])

    assert code == 0
    assert "- status: complete" in capsys.readouterr().out


def test_main_returns_error_for_missing_record(tmp_path, capsys):
    code = deployment_decision_check.main(
        ["--path", str(tmp_path / "missing.md")]
    )

    assert code == 2
    assert "Deployment decision check failed" in capsys.readouterr().err
