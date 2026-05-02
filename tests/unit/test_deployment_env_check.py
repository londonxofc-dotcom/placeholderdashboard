from tools import deployment_env_check


def test_local_profile_only_requires_database_url():
    rows = deployment_env_check.check_environment({}, production=False)

    assert rows == [
        {"name": "DATABASE_URL", "status": "missing", "required": "yes"},
        {"name": "ANTHROPIC_API_KEY", "status": "optional", "required": "no"},
        {"name": "ALLOWED_ORIGINS", "status": "optional", "required": "no"},
        {"name": "NEXT_PUBLIC_API_URL", "status": "optional", "required": "no"},
    ]
    assert deployment_env_check.has_blockers(rows) is True


def test_production_profile_requires_deployment_variables():
    rows = deployment_env_check.check_environment(
        {
            "DATABASE_URL": "postgresql://example",
            "ANTHROPIC_API_KEY": "sk-ant-test",
            "ALLOWED_ORIGINS": "https://cockpit.example.com",
        },
        production=True,
    )

    assert rows == [
        {"name": "DATABASE_URL", "status": "ok", "required": "yes"},
        {"name": "ANTHROPIC_API_KEY", "status": "ok", "required": "yes"},
        {"name": "ALLOWED_ORIGINS", "status": "ok", "required": "yes"},
        {"name": "NEXT_PUBLIC_API_URL", "status": "missing", "required": "yes"},
    ]
    assert deployment_env_check.has_blockers(rows) is True


def test_production_profile_rejects_malformed_database_url():
    rows = deployment_env_check.check_environment(
        {
            "DATABASE_URL": "not-a-url",
            "ANTHROPIC_API_KEY": "sk-ant-test",
            "ALLOWED_ORIGINS": "https://cockpit.example.com",
            "NEXT_PUBLIC_API_URL": "https://backend.example.com/api",
        },
        production=True,
    )

    assert rows[0] == {
        "name": "DATABASE_URL",
        "status": "invalid",
        "required": "yes",
    }
    assert deployment_env_check.has_blockers(rows) is True


def test_production_profile_accepts_postgres_database_url():
    rows = deployment_env_check.check_environment(
        {
            "DATABASE_URL": "postgresql://user:pass@db.example.com/app",
            "ANTHROPIC_API_KEY": "sk-ant-test",
            "ALLOWED_ORIGINS": "https://cockpit.example.com",
            "NEXT_PUBLIC_API_URL": "https://backend.example.com/api",
        },
        production=True,
    )

    assert rows[0] == {
        "name": "DATABASE_URL",
        "status": "ok",
        "required": "yes",
    }
    assert deployment_env_check.has_blockers(rows) is False


def test_placeholder_values_are_treated_as_missing():
    assert deployment_env_check.is_configured("your-api-key-here") is False
    assert deployment_env_check.is_configured(" placeholder ") is False
    assert deployment_env_check.is_configured("sk-ant-test") is True


def test_production_profile_rejects_wildcard_allowed_origins():
    rows = deployment_env_check.check_environment(
        {
            "DATABASE_URL": "postgresql://example",
            "ANTHROPIC_API_KEY": "sk-ant-test",
            "ALLOWED_ORIGINS": "https://cockpit.example.com, *",
            "NEXT_PUBLIC_API_URL": "https://cockpit.example.com/api",
        },
        production=True,
    )

    assert rows == [
        {"name": "DATABASE_URL", "status": "ok", "required": "yes"},
        {"name": "ANTHROPIC_API_KEY", "status": "ok", "required": "yes"},
        {"name": "ALLOWED_ORIGINS", "status": "invalid", "required": "yes"},
        {"name": "NEXT_PUBLIC_API_URL", "status": "ok", "required": "yes"},
    ]
    assert deployment_env_check.has_blockers(rows) is True


def test_production_profile_rejects_malformed_allowed_origins():
    rows = deployment_env_check.check_environment(
        {
            "DATABASE_URL": "postgresql://example",
            "ANTHROPIC_API_KEY": "sk-ant-test",
            "ALLOWED_ORIGINS": "https://cockpit.example.com/path",
            "NEXT_PUBLIC_API_URL": "https://backend.example.com/api",
        },
        production=True,
    )

    assert rows[2] == {
        "name": "ALLOWED_ORIGINS",
        "status": "invalid",
        "required": "yes",
    }
    assert deployment_env_check.has_blockers(rows) is True


def test_production_profile_accepts_comma_separated_exact_origins():
    rows = deployment_env_check.check_environment(
        {
            "DATABASE_URL": "postgresql://example",
            "ANTHROPIC_API_KEY": "sk-ant-test",
            "ALLOWED_ORIGINS": (
                "https://cockpit.example.com, http://localhost:3000"
            ),
            "NEXT_PUBLIC_API_URL": "https://backend.example.com/api",
        },
        production=True,
    )

    assert rows[2] == {
        "name": "ALLOWED_ORIGINS",
        "status": "ok",
        "required": "yes",
    }
    assert deployment_env_check.has_blockers(rows) is False


def test_local_profile_does_not_reject_wildcard_allowed_origins():
    rows = deployment_env_check.check_environment(
        {
            "DATABASE_URL": "postgresql://localhost/db",
            "ALLOWED_ORIGINS": "*",
        },
        production=False,
    )

    assert rows[2] == {
        "name": "ALLOWED_ORIGINS",
        "status": "ok",
        "required": "no",
    }
    assert deployment_env_check.has_blockers(rows) is False


def test_production_profile_requires_next_public_api_url_path():
    rows = deployment_env_check.check_environment(
        {
            "DATABASE_URL": "postgresql://example",
            "ANTHROPIC_API_KEY": "sk-ant-test",
            "ALLOWED_ORIGINS": "https://cockpit.example.com",
            "NEXT_PUBLIC_API_URL": "https://backend.example.com",
        },
        production=True,
    )

    assert rows == [
        {"name": "DATABASE_URL", "status": "ok", "required": "yes"},
        {"name": "ANTHROPIC_API_KEY", "status": "ok", "required": "yes"},
        {"name": "ALLOWED_ORIGINS", "status": "ok", "required": "yes"},
        {"name": "NEXT_PUBLIC_API_URL", "status": "invalid", "required": "yes"},
    ]
    assert deployment_env_check.has_blockers(rows) is True


def test_production_profile_requires_next_public_api_url_http_url():
    rows = deployment_env_check.check_environment(
        {
            "DATABASE_URL": "postgresql://example",
            "ANTHROPIC_API_KEY": "sk-ant-test",
            "ALLOWED_ORIGINS": "https://cockpit.example.com",
            "NEXT_PUBLIC_API_URL": "backend.example.com/api",
        },
        production=True,
    )

    assert rows[3] == {
        "name": "NEXT_PUBLIC_API_URL",
        "status": "invalid",
        "required": "yes",
    }
    assert deployment_env_check.has_blockers(rows) is True


def test_production_profile_accepts_next_public_api_url_api_path():
    rows = deployment_env_check.check_environment(
        {
            "DATABASE_URL": "postgresql://example",
            "ANTHROPIC_API_KEY": "sk-ant-test",
            "ALLOWED_ORIGINS": "https://cockpit.example.com",
            "NEXT_PUBLIC_API_URL": "https://backend.example.com/api",
        },
        production=True,
    )

    assert rows[3] == {
        "name": "NEXT_PUBLIC_API_URL",
        "status": "ok",
        "required": "yes",
    }
    assert deployment_env_check.has_blockers(rows) is False


def test_report_never_prints_secret_values():
    rows = deployment_env_check.check_environment(
        {
            "DATABASE_URL": "postgresql://user:secret@example/db",
            "ANTHROPIC_API_KEY": "sk-ant-secret",
            "ALLOWED_ORIGINS": "https://cockpit.example.com",
            "NEXT_PUBLIC_API_URL": "https://cockpit.example.com/api",
        },
        production=True,
    )

    report = deployment_env_check.render_report(rows, production=True)

    assert "sk-ant-secret" not in report
    assert "postgresql://user:secret@example/db" not in report
    assert "ANTHROPIC_API_KEY: ok" in report
    assert deployment_env_check.has_blockers(rows) is False


def test_main_returns_failure_for_missing_production_env(monkeypatch, capsys):
    monkeypatch.setattr(deployment_env_check.os, "environ", {})

    code = deployment_env_check.main(["--production"])

    assert code == 1
    assert "Deployment environment check (production)" in capsys.readouterr().out


def test_main_returns_success_for_configured_local_env(monkeypatch):
    monkeypatch.setattr(
        deployment_env_check.os,
        "environ",
        {"DATABASE_URL": "postgresql://localhost/db"},
    )

    assert deployment_env_check.main([]) == 0


def test_main_reads_sys_argv_when_argv_is_not_supplied(monkeypatch, capsys):
    monkeypatch.setattr(deployment_env_check.sys, "argv", ["tool", "--production"])
    monkeypatch.setattr(deployment_env_check.os, "environ", {})

    assert deployment_env_check.main() == 1
    assert "Deployment environment check (production)" in capsys.readouterr().out
