from __future__ import annotations

import json
import sys

from gate_common import build_session_start_context


def main() -> int:
    output = {
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": build_session_start_context(),
        }
    }
    json.dump(output, sys.stdout)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
