from __future__ import annotations

import json
import sys
from pathlib import Path

from gate_common import (
    build_stop_context,
    detect_validation_targets,
    get_changed_files,
    missing_validation_requirements,
    read_successful_commands,
    resolve_codex_home,
)


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        payload = {}

    cwd = Path(payload.get("cwd") or ".").resolve()
    changed_files = get_changed_files(cwd)
    targets = detect_validation_targets(changed_files)
    if not targets:
        return 0

    session_id = payload.get("session_id")
    if not session_id:
        return 0

    turn_id = payload.get("turn_id")
    successful_commands = read_successful_commands(
        session_id=session_id,
        turn_id=turn_id,
        codex_home=resolve_codex_home(),
    )
    missing_commands = missing_validation_requirements(targets, successful_commands)
    if not missing_commands:
        return 0

    output = {
        "hookSpecificOutput": {
            "hookEventName": "Stop",
            "additionalContext": build_stop_context(
                changed_files=changed_files,
                missing_commands=missing_commands,
            ),
        }
    }
    json.dump(output, sys.stdout)
    sys.stdout.write("\n")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
