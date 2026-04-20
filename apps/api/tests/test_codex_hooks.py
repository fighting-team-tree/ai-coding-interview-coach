from __future__ import annotations

import importlib.util
import json
import shutil
import sys
from pathlib import Path


def _load_module(module_name: str, path: Path):
    spec = importlib.util.spec_from_file_location(module_name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None and spec.loader is not None
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


ROOT_DIR = Path(__file__).resolve().parents[3]
GATE_COMMON = _load_module("gate_common", ROOT_DIR / ".codex" / "hooks" / "gate_common.py")
RENDER_HOOKS = _load_module("render_hooks", ROOT_DIR / ".codex" / "hooks" / "render_hooks.py")


def test_detect_validation_targets_maps_web_and_api_changes() -> None:
    targets = GATE_COMMON.detect_validation_targets(
        [
            "apps/web/app/page.tsx",
            "apps/api/app/main.py",
            "docs/platform_plan.md",
        ]
    )

    assert targets == {"api", "web"}


def test_missing_requirements_accept_verify_scripts() -> None:
    missing = GATE_COMMON.missing_validation_requirements(
        {"api", "web"},
        ["npm run verify:web", "npm run verify:api"],
    )

    assert missing == []


def test_read_successful_commands_filters_to_current_turn() -> None:
    session_id = "019dabf1-cd48-73e0-905f-fc65752a9f23"
    codex_home = ROOT_DIR / "tmp-test-artifacts" / "codex-hooks" / session_id
    shutil.rmtree(codex_home, ignore_errors=True)
    try:
        rollout_dir = codex_home / "sessions" / "2026" / "04" / "21"
        rollout_dir.mkdir(parents=True)
        rollout_path = rollout_dir / f"rollout-2026-04-21T02-30-43-{session_id}.jsonl"

        events = [
            {
                "type": "event_msg",
                "payload": {
                    "type": "exec_command_end",
                    "turn_id": "turn-1",
                    "command": ["npm", "run", "verify:web"],
                    "exit_code": 0,
                    "status": "completed",
                },
            },
            {
                "type": "event_msg",
                "payload": {
                    "type": "exec_command_end",
                    "turn_id": "turn-2",
                    "command": ["npm", "run", "verify:api"],
                    "exit_code": 0,
                    "status": "completed",
                },
            },
        ]
        rollout_path.write_text(
            "".join(json.dumps(event) + "\n" for event in events),
            encoding="utf-8",
        )

        commands = GATE_COMMON.read_successful_commands(
            session_id=session_id,
            turn_id="turn-2",
            codex_home=codex_home,
        )

        assert commands == ["npm run verify:api"]
    finally:
        shutil.rmtree(codex_home, ignore_errors=True)


def test_render_hooks_unix_prefers_python3() -> None:
    settings = RENDER_HOOKS.HookSettings()

    config = RENDER_HOOKS.render_hooks_config(
        settings,
        platform_name="linux",
        which=lambda command: "/usr/bin/python3" if command == "python3" else None,
    )

    command = config["hooks"]["SessionStart"][0]["hooks"][0]["command"]
    assert command == "python3 .codex/hooks/session_start_policy.py"


def test_render_hooks_windows_auto_prefers_pwsh() -> None:
    settings = RENDER_HOOKS.HookSettings()

    def fake_which(command: str) -> str | None:
        mapping = {
            "pwsh": "C:/Program Files/PowerShell/7/pwsh.exe",
            "pwsh.exe": "C:/Program Files/PowerShell/7/pwsh.exe",
            "py": "C:/Windows/py.exe",
            "py.exe": "C:/Windows/py.exe",
        }
        return mapping.get(command)

    config = RENDER_HOOKS.render_hooks_config(settings, platform_name="windows", which=fake_which)

    command = config["hooks"]["SessionStart"][0]["hooks"][0]["command"]
    assert command.startswith('pwsh -NoProfile -Command "& { py -3 ')
    assert "session_start_policy.py" in command


def test_render_hooks_windows_auto_falls_back_to_powershell_then_cmd() -> None:
    settings = RENDER_HOOKS.HookSettings()

    def powershell_only(command: str) -> str | None:
        mapping = {
            "powershell": "C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe",
            "powershell.exe": "C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe",
            "python": "C:/Python312/python.exe",
        }
        return mapping.get(command)

    ps_config = RENDER_HOOKS.render_hooks_config(
        settings,
        platform_name="windows",
        which=powershell_only,
    )
    ps_command = ps_config["hooks"]["Stop"][0]["hooks"][0]["command"]
    assert ps_command.startswith('powershell -NoProfile -Command "& { python ')
    assert "stop_require_validation.py" in ps_command

    def cmd_only(command: str) -> str | None:
        mapping = {
            "cmd": "C:/Windows/System32/cmd.exe",
            "cmd.exe": "C:/Windows/System32/cmd.exe",
            "python3": "C:/Python312/python3.exe",
        }
        return mapping.get(command)

    cmd_config = RENDER_HOOKS.render_hooks_config(settings, platform_name="windows", which=cmd_only)
    cmd_command = cmd_config["hooks"]["Stop"][0]["hooks"][0]["command"]
    assert cmd_command == 'cmd /d /c "python3 .codex\\hooks\\stop_require_validation.py"'


def test_render_hooks_windows_explicit_shell_is_honored() -> None:
    settings = RENDER_HOOKS.HookSettings(windows_shell="cmd")

    def fake_which(command: str) -> str | None:
        mapping = {
            "cmd": "C:/Windows/System32/cmd.exe",
            "cmd.exe": "C:/Windows/System32/cmd.exe",
            "py": "C:/Windows/py.exe",
            "py.exe": "C:/Windows/py.exe",
        }
        return mapping.get(command)

    config = RENDER_HOOKS.render_hooks_config(settings, platform_name="windows", which=fake_which)

    command = config["hooks"]["SessionStart"][0]["hooks"][0]["command"]
    assert command == 'cmd /d /c "py -3 .codex\\hooks\\session_start_policy.py"'


def test_build_session_start_context_mentions_os_aware_hooks() -> None:
    context = GATE_COMMON.build_session_start_context()

    assert "disabled on native Windows" not in context
    assert "pwsh -> powershell -> cmd" in context
