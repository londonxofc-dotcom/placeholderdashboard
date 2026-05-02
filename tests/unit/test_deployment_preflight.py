from tools import deployment_preflight


def test_build_steps_defaults_to_full_preflight():
    steps = deployment_preflight.build_steps()

    assert [step.name for step in steps] == [
        "backend tests",
        "ui typecheck",
        "ui build",
        "ui tests",
    ]
    assert steps[0].command[1:] == ("-m", "pytest", "tests/", "-v")
    assert steps[1].command == ("npm", "--prefix", "ui", "run", "typecheck")
    assert steps[2].command == ("npm", "--prefix", "ui", "run", "build")
    assert steps[3].command == ("npm", "--prefix", "ui", "test")


def test_build_steps_can_include_decision_check():
    steps = deployment_preflight.build_steps(include_decision_check=True)

    assert [step.name for step in steps] == [
        "deployment decision check",
        "backend tests",
        "ui typecheck",
        "ui build",
        "ui tests",
    ]
    assert steps[0].command[1:] == ("tools/deployment_decision_check.py",)


def test_build_steps_can_include_production_env_check():
    steps = deployment_preflight.build_steps(include_production_env_check=True)

    assert [step.name for step in steps] == [
        "production environment check",
        "backend tests",
        "ui typecheck",
        "ui build",
        "ui tests",
    ]
    assert steps[0].command[1:] == (
        "tools/deployment_env_check.py",
        "--production",
    )


def test_build_steps_can_include_probe_check():
    steps = deployment_preflight.build_steps(
        include_probe_check=True,
        probe_base_url="https://backend.example.com",
    )

    assert [step.name for step in steps] == [
        "deployment probe check",
        "backend tests",
        "ui typecheck",
        "ui build",
        "ui tests",
    ]
    assert steps[0].command[1:] == (
        "tools/deployment_probe_check.py",
        "--base-url",
        "https://backend.example.com",
    )


def test_build_steps_can_allow_degraded_ready_probe_check():
    steps = deployment_preflight.build_steps(
        include_probe_check=True,
        allow_degraded_ready=True,
    )

    assert steps[0].command[1:] == (
        "tools/deployment_probe_check.py",
        "--base-url",
        "http://localhost:8000",
        "--allow-degraded-ready",
    )


def test_build_steps_runs_launch_checks_before_verification():
    steps = deployment_preflight.build_steps(
        include_decision_check=True,
        include_production_env_check=True,
        include_probe_check=True,
    )

    assert [step.name for step in steps[:4]] == [
        "deployment decision check",
        "production environment check",
        "deployment probe check",
        "backend tests",
    ]


def test_build_steps_can_run_backend_only():
    steps = deployment_preflight.build_steps(include_backend=True, include_ui=False)

    assert [step.name for step in steps] == ["backend tests"]


def test_build_steps_can_run_ui_only_without_build():
    steps = deployment_preflight.build_steps(
        include_backend=False,
        include_ui=True,
        skip_ui_build=True,
    )

    assert [step.name for step in steps] == ["ui typecheck", "ui tests"]


def test_main_rejects_conflicting_modes(capsys):
    code = deployment_preflight.main(["--backend-only", "--ui-only"])

    assert code == 2
    assert "Choose at most one" in capsys.readouterr().err


def test_main_reports_generated_churn(monkeypatch, capsys):
    calls: list[str] = []

    def fake_run_step(step):
        calls.append(step.name)
        return 0

    monkeypatch.setattr(deployment_preflight, "run_step", fake_run_step)
    statuses = iter(["", " M ui/next-env.d.ts"])
    monkeypatch.setattr(
        deployment_preflight,
        "protected_file_status",
        lambda: next(statuses),
    )

    code = deployment_preflight.main(["--ui-only"])

    assert code == 1
    assert calls == ["ui typecheck", "ui build", "ui tests"]
    stderr = capsys.readouterr().err
    assert "protected tracked files are dirty" in stderr
    assert "ui/next-env.d.ts" in stderr


def test_main_fails_fast_when_protected_files_are_dirty(monkeypatch, capsys):
    calls: list[str] = []

    def fake_run_step(step):
        calls.append(step.name)
        return 0

    monkeypatch.setattr(deployment_preflight, "run_step", fake_run_step)
    monkeypatch.setattr(
        deployment_preflight,
        "protected_file_status",
        lambda: " M current.md",
    )

    code = deployment_preflight.main(["--backend-only"])

    assert code == 1
    assert calls == []
    assert "protected tracked files are dirty" in capsys.readouterr().err


def test_main_passes_when_selected_steps_pass(monkeypatch, capsys):
    calls: list[str] = []

    def fake_run_step(step):
        calls.append(step.name)
        return 0

    monkeypatch.setattr(deployment_preflight, "run_step", fake_run_step)
    monkeypatch.setattr(deployment_preflight, "protected_file_status", lambda: "")

    code = deployment_preflight.main(["--backend-only"])

    assert code == 0
    assert calls == ["backend tests"]
    assert "Preflight passed" in capsys.readouterr().out


def test_main_can_fail_at_decision_check(monkeypatch, capsys):
    calls: list[str] = []

    def fake_run_step(step):
        calls.append(step.name)
        return 1 if step.name == "deployment decision check" else 0

    monkeypatch.setattr(deployment_preflight, "run_step", fake_run_step)
    monkeypatch.setattr(deployment_preflight, "protected_file_status", lambda: "")

    code = deployment_preflight.main(
        ["--backend-only", "--include-decision-check"]
    )

    assert code == 1
    assert calls == ["deployment decision check"]
    assert "Preflight failed at: deployment decision check" in capsys.readouterr().err


def test_main_can_fail_at_production_env_check(monkeypatch, capsys):
    calls: list[str] = []

    def fake_run_step(step):
        calls.append(step.name)
        return 1 if step.name == "production environment check" else 0

    monkeypatch.setattr(deployment_preflight, "run_step", fake_run_step)
    monkeypatch.setattr(deployment_preflight, "protected_file_status", lambda: "")

    code = deployment_preflight.main(
        ["--backend-only", "--include-production-env-check"]
    )

    assert code == 1
    assert calls == ["production environment check"]
    assert (
        "Preflight failed at: production environment check"
        in capsys.readouterr().err
    )
