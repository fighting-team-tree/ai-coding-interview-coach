from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path


TARGET_WEB = "web"
TARGET_API = "api"

WEB_VERIFY_COMMAND = "npm run verify:web"
API_VERIFY_COMMAND = "npm run verify:api"


def detect_validation_targets(changed_files: list[str]) -> set[str]:
    targets: set[str] = set()
    for path in changed_files:
        normalized = path.replace("\\", "/")
        if normalized.startswith("apps/web/"):
            targets.add(TARGET_WEB)
        if normalized.startswith("apps/api/"):
            targets.add(TARGET_API)
    return targets


def find_repo_root(cwd: Path) -> Path | None:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        cwd=cwd,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        return None
    return Path(result.stdout.strip())


def get_changed_files(cwd: Path) -> list[str]:
    repo_root = find_repo_root(cwd)
    if repo_root is None:
        return []

    result = subprocess.run(
        ["git", "status", "--porcelain", "--untracked-files=all"],
        cwd=repo_root,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        return []

    changed_files: list[str] = []
    for line in result.stdout.splitlines():
        if not line:
            continue
        path = line[3:]
        if " -> " in path:
            path = path.split(" -> ", maxsplit=1)[1]
        changed_files.append(path.strip())
    return changed_files


def resolve_codex_home() -> Path:
    return Path(os.environ.get("CODEX_HOME", Path.home() / ".codex"))


def find_rollout_path(*, session_id: str, codex_home: Path) -> Path | None:
    pattern = f"rollout-*{session_id}.jsonl"
    candidates = sorted(
        (codex_home / "sessions").rglob(pattern),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    return candidates[0] if candidates else None


def read_successful_commands(*, session_id: str, turn_id: str | None, codex_home: Path) -> list[str]:
    rollout_path = find_rollout_path(session_id=session_id, codex_home=codex_home)
    if rollout_path is None:
        return []

    commands: list[str] = []
    for line in rollout_path.read_text(encoding="utf-8").splitlines():
        if not line:
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue

        if event.get("type") != "event_msg":
            continue
        payload = event.get("payload", {})
        if payload.get("type") != "exec_command_end":
            continue
        if payload.get("status") != "completed" or payload.get("exit_code") != 0:
            continue
        if turn_id and payload.get("turn_id") != turn_id:
            continue

        command = payload.get("command")
        if isinstance(command, list):
            commands.append(" ".join(str(part) for part in command))
        elif isinstance(command, str):
            commands.append(command)
    return commands


def missing_validation_requirements(targets: set[str], successful_commands: list[str]) -> list[str]:
    missing: list[str] = []

    if TARGET_WEB in targets and not _has_web_verification(successful_commands):
        missing.append(WEB_VERIFY_COMMAND)
    if TARGET_API in targets and not _has_api_verification(successful_commands):
        missing.append(API_VERIFY_COMMAND)

    return missing


def _has_web_verification(commands: list[str]) -> bool:
    if any("verify:web" in command or "npm run verify" in command for command in commands):
        return True

    required_tokens = ("run lint", "run typecheck", "run test", "run build")
    return all(any(token in command for command in commands) for token in required_tokens)


def _has_api_verification(commands: list[str]) -> bool:
    if any("verify:api" in command or "npm run verify" in command for command in commands):
        return True

    required_tokens = ("ruff check", "python -m compileall", "pytest")
    return all(any(token in command for command in commands) for token in required_tokens)


def build_session_start_context() -> str:
    return (
        "Validation gate for this repository:\n"
        "- After changing files under apps/web, run `npm run verify:web` before ending the task.\n"
        "- After changing files under apps/api, run `npm run verify:api` before ending the task.\n"
        "- If both areas changed, run both or the root `npm run verify`.\n"
        "- Docs-only and data-only changes do not require verification.\n"
        "- For commit work, read `.codex/workflows/commit-policy.md` and default to Korean commit message descriptions.\n"
        "- Before any commit, inspect status/diff, propose numbered commit options, and wait for explicit user approval.\n"
        "- Codex Default mode cannot use the Plan mode question tool, so commit approval must use text-based numbered choices.\n"
        "- Project hooks are rendered from `.codex/hooks/settings.toml` into `.codex/hooks.json`.\n"
        "- Windows uses the configured shell policy (`auto` defaults to `pwsh -> powershell -> cmd`)."
    )


def build_stop_context(*, changed_files: list[str], missing_commands: list[str]) -> str:
    changed_summary = "\n".join(f"- {path}" for path in changed_files[:10]) or "- none"
    required_summary = "\n".join(f"- {command}" for command in missing_commands)
    return (
        "Validation is still required before this task can stop.\n"
        "Changed files detected in validated areas:\n"
        f"{changed_summary}\n"
        "Run these commands successfully, then continue:\n"
        f"{required_summary}"
    )
