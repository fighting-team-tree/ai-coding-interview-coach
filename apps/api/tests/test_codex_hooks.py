from __future__ import annotations

import importlib.util
import json
from pathlib import Path


def _load_module(module_name: str, path: Path):
    spec = importlib.util.spec_from_file_location(module_name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec is not None and spec.loader is not None
    spec.loader.exec_module(module)
    return module


ROOT_DIR = Path(__file__).resolve().parents[3]
GATE_COMMON = _load_module("gate_common", ROOT_DIR / ".codex" / "hooks" / "gate_common.py")


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


def test_read_successful_commands_filters_to_current_turn(tmp_path: Path) -> None:
    session_id = "019dabf1-cd48-73e0-905f-fc65752a9f23"
    codex_home = tmp_path / ".codex"
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
    rollout_path.write_text("".join(json.dumps(event) + "\n" for event in events), encoding="utf-8")

    commands = GATE_COMMON.read_successful_commands(
        session_id=session_id,
        turn_id="turn-2",
        codex_home=codex_home,
    )

    assert commands == ["npm run verify:api"]
