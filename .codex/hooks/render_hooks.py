from __future__ import annotations

import argparse
import json
import platform as platform_lib
import shlex
import shutil
import tomllib
from dataclasses import dataclass
from pathlib import Path
from typing import Callable


ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_SETTINGS_PATH = ROOT_DIR / ".codex" / "hooks" / "settings.toml"
DEFAULT_OUTPUT_PATH = ROOT_DIR / ".codex" / "hooks.json"
HOOK_TIMEOUT_SECONDS = 10
HOOK_SCRIPTS = {
    "SessionStart": ".codex/hooks/session_start_policy.py",
    "Stop": ".codex/hooks/stop_require_validation.py",
}
SUPPORTED_PLATFORMS = {"auto", "windows", "linux", "darwin"}
SUPPORTED_WINDOWS_SHELLS = {"auto", "pwsh", "powershell", "cmd"}
WhichFn = Callable[[str], str | None]


@dataclass(frozen=True)
class HookSettings:
    platform: str = "auto"
    windows_shell: str = "auto"
    windows_shell_order: tuple[str, ...] = ("pwsh", "powershell", "cmd")
    unix_launchers: tuple[str, ...] = ("python3", "python")
    windows_launchers: tuple[str, ...] = ("py -3", "python", "python3")


def load_settings(path: Path) -> HookSettings:
    raw = tomllib.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    platform_name = _normalize_value(raw.get("platform", "auto"))
    if platform_name not in SUPPORTED_PLATFORMS:
        raise ValueError(f"Unsupported platform setting: {platform_name}")

    windows = raw.get("windows", {})
    windows_shell = _normalize_value(windows.get("shell", "auto"))
    if windows_shell not in SUPPORTED_WINDOWS_SHELLS:
        raise ValueError(f"Unsupported Windows shell setting: {windows_shell}")

    windows_shell_order = tuple(_normalize_sequence(windows.get("shell_order", ["pwsh", "powershell", "cmd"])))
    for shell_name in windows_shell_order:
        if shell_name not in {"pwsh", "powershell", "cmd"}:
            raise ValueError(f"Unsupported Windows shell in shell_order: {shell_name}")

    python_settings = raw.get("python", {})
    unix_launchers = tuple(_normalize_sequence(python_settings.get("unix_launchers", ["python3", "python"])))
    windows_launchers = tuple(
        _normalize_sequence(python_settings.get("windows_launchers", ["py -3", "python", "python3"]))
    )

    if not unix_launchers:
        raise ValueError("python.unix_launchers must not be empty")
    if not windows_launchers:
        raise ValueError("python.windows_launchers must not be empty")

    return HookSettings(
        platform=platform_name,
        windows_shell=windows_shell,
        windows_shell_order=windows_shell_order,
        unix_launchers=unix_launchers,
        windows_launchers=windows_launchers,
    )


def resolve_platform(preferred: str, system_name: str | None = None) -> str:
    normalized = _normalize_value(preferred)
    if normalized != "auto":
        if normalized not in SUPPORTED_PLATFORMS - {"auto"}:
            raise ValueError(f"Unsupported platform override: {normalized}")
        return normalized

    detected = _normalize_value(system_name or platform_lib.system())
    if detected.startswith("win"):
        return "windows"
    if detected.startswith("linux"):
        return "linux"
    if detected.startswith("darwin") or detected.startswith("mac"):
        return "darwin"
    raise ValueError(f"Unsupported host platform: {detected}")


def render_hooks_config(
    settings: HookSettings,
    *,
    platform_name: str | None = None,
    windows_shell_override: str | None = None,
    which: WhichFn = shutil.which,
) -> dict[str, object]:
    target_platform = resolve_platform(platform_name or settings.platform)
    windows_shell = None
    if target_platform == "windows":
        preferred_shell = _normalize_value(windows_shell_override or settings.windows_shell)
        windows_shell = select_windows_shell(preferred_shell, settings.windows_shell_order, which=which)
        python_launcher = select_python_launcher(target_platform, settings, which=which)
    else:
        python_launcher = select_python_launcher(target_platform, settings, which=which)

    hooks: dict[str, list[dict[str, object]]] = {}
    for event_name, script_path in HOOK_SCRIPTS.items():
        hooks[event_name] = [
            {
                "hooks": [
                    {
                        "type": "command",
                        "command": build_hook_command(
                            script_path=script_path,
                            platform_name=target_platform,
                            python_launcher=python_launcher,
                            windows_shell=windows_shell,
                        ),
                        "timeout": HOOK_TIMEOUT_SECONDS,
                    }
                ]
            }
        ]
    return {"hooks": hooks}


def select_windows_shell(preferred: str, order: tuple[str, ...], *, which: WhichFn) -> str:
    normalized = _normalize_value(preferred)
    if normalized != "auto":
        if not is_command_available(normalized, which=which):
            raise ValueError(f"Configured Windows shell is not available: {normalized}")
        return normalized

    for shell_name in order:
        if is_command_available(shell_name, which=which):
            return shell_name
    raise ValueError("No supported Windows shell found. Tried: " + ", ".join(order))


def select_python_launcher(platform_name: str, settings: HookSettings, *, which: WhichFn) -> str:
    candidates = settings.windows_launchers if platform_name == "windows" else settings.unix_launchers
    for launcher in candidates:
        if is_command_available(launcher, which=which):
            return launcher
    raise ValueError(f"No supported Python launcher found for {platform_name}: {', '.join(candidates)}")


def build_hook_command(
    *,
    script_path: str,
    platform_name: str,
    python_launcher: str,
    windows_shell: str | None,
) -> str:
    if platform_name == "windows":
        if windows_shell is None:
            raise ValueError("windows_shell is required for Windows hook generation")
        return build_windows_hook_command(script_path=script_path, python_launcher=python_launcher, shell_name=windows_shell)
    return f"{python_launcher} {shlex.quote(script_path)}"


def build_windows_hook_command(*, script_path: str, python_launcher: str, shell_name: str) -> str:
    if shell_name == "cmd":
        windows_path = script_path.replace("/", "\\")
        return f'cmd /d /c "{python_launcher} {windows_path}"'

    escaped_path = script_path.replace("'", "''")
    executable = "pwsh" if shell_name == "pwsh" else "powershell"
    return f'{executable} -NoProfile -Command "& {{ {python_launcher} \'{escaped_path}\' }}"'


def is_command_available(command: str, *, which: WhichFn) -> bool:
    executable = command.strip().split()[0]
    names = [executable]
    if executable == "cmd":
        names.append("cmd.exe")
    elif executable == "powershell":
        names.append("powershell.exe")
    elif executable == "pwsh":
        names.append("pwsh.exe")
    elif executable == "py":
        names.append("py.exe")
    return any(which(name) for name in names)


def write_hooks_file(config: dict[str, object], output_path: Path) -> None:
    output_path.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render OS-aware Codex hooks.json")
    parser.add_argument("--settings", type=Path, default=DEFAULT_SETTINGS_PATH, help="Path to the hooks settings TOML")
    parser.add_argument(
        "--platform",
        choices=sorted(SUPPORTED_PLATFORMS),
        default=None,
        help="Target platform override",
    )
    parser.add_argument(
        "--windows-shell",
        choices=sorted(SUPPORTED_WINDOWS_SHELLS),
        default=None,
        help="Windows shell override",
    )
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_PATH, help="Path to write hooks.json")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    settings = load_settings(args.settings)
    config = render_hooks_config(
        settings,
        platform_name=args.platform,
        windows_shell_override=args.windows_shell,
    )
    write_hooks_file(config, args.output)
    return 0


def _normalize_sequence(values: list[str]) -> list[str]:
    return [_normalize_value(value) for value in values]


def _normalize_value(value: str) -> str:
    return str(value).strip().lower()


if __name__ == "__main__":
    raise SystemExit(main())
