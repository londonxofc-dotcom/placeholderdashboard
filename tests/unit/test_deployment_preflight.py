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
    monkeypatch.setattr(
        deployment_preflight,
        "git_status_for",
        lambda paths: " M ui/next-env.d.ts",
    )

    code = deployment_preflight.main(["--ui-only"])

    assert code == 1
    assert calls == ["ui typecheck", "ui build", "ui tests"]
    assert "ui/next-env.d.ts changed" in capsys.readouterr().err


def test_main_passes_when_selected_steps_pass(monkeypatch, capsys):
    calls: list[str] = []

    def fake_run_step(step):
        calls.append(step.name)
        return 0

    monkeypatch.setattr(deployment_preflight, "run_step", fake_run_step)
    monkeypatch.setattr(deployment_preflight, "git_status_for", lambda paths: "")

    code = deployment_preflight.main(["--backend-only"])

    assert code == 0
    assert calls == ["backend tests"]
    assert "Preflight passed" in capsys.readouterr().out
