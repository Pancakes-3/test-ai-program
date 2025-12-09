"""Entry point for the local terminal coding assistant."""
from __future__ import annotations

import os
import platform
from pathlib import Path
from typing import Optional

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.prompt import Prompt
    RICH_AVAILABLE = True
except Exception:  # pragma: no cover - optional dependency
    Console = None
    Panel = None
    Prompt = None
    RICH_AVAILABLE = False

from assistant_core import CodingAssistant
from code_tools import extract_code_blocks, format_run_result, run_python
from memory import InMemoryStore, MemoryStore, load_config


WELCOME = """Welcome to the local coding assistant!\n"
"No external AI APIs are used; knowledge comes from rules, tools, and your feedback.\n"
"Type /help for commands or start asking programming questions."""


class TerminalUI:
    """Simple wrapper around input/output with optional Rich styling."""

    def __init__(self, use_rich: bool):
        self.use_rich = use_rich and RICH_AVAILABLE
        self.console = Console() if self.use_rich else None

    def info(self, message: str) -> None:
        if self.console:
            self.console.print(Panel(message))
        else:
            print(message)

    def output(self, message: str) -> None:
        if self.console:
            self.console.print(message)
        else:
            print(message)

    def prompt(self, message: str = "> ") -> str:
        if self.console and Prompt:
            return Prompt.ask(message)
        return input(message)


def load_settings(config_path: Path) -> dict:
    defaults = {
        "use_sklearn": False,
        "max_history": 20,
        "auto_run_code": False,
        "memory_path": str(default_memory_path()),
        "rich_output": RICH_AVAILABLE,
    }
    loaded = load_config(config_path)
    defaults.update(loaded)
    return defaults


def default_memory_path() -> Path:
    """Choose a user-writable default location for the memory database."""
    system = platform.system().lower()
    home = Path.home()
    if system == "windows":  # pragma: no cover - platform specific
        base_dir = Path(os.environ.get("APPDATA", home / "AppData" / "Roaming"))
    elif system == "darwin":  # pragma: no cover - platform specific
        base_dir = home / "Library" / "Application Support"
    else:
        base_dir = home / ".local" / "share"
    return base_dir / "local_coding_assistant" / "memory.db"


def resolve_memory_path(config_path: Path, configured_path: str) -> Path:
    """Resolve a configured memory path relative to the config file location if needed."""
    candidate = Path(configured_path)
    if not candidate.is_absolute():
        candidate = config_path.parent / candidate
    return candidate


def show_help(ui: TerminalUI) -> None:
    ui.info(
        """Commands:\n"
        "/help     - Show this help message\n"
        "/history  - Show recent Q&A pairs\n"
        "/run      - Run the last code block you or I mentioned\n"
        "/correct  - Provide a correction to improve future answers\n"
        "/quit     - Exit the assistant"""
    )


def handle_run(ui: TerminalUI, last_code: Optional[str]) -> None:
    if not last_code:
        ui.output("No code block available to run. Paste code using fenced ``` blocks first.")
        return
    result = run_python(last_code)
    ui.output(format_run_result(result))


def main() -> None:
    config_path = Path("config.json")
    config = load_settings(config_path)
    ui = TerminalUI(config.get("rich_output", False))
    ui.info(WELCOME)
    configured_path = resolve_memory_path(config_path, config.get("memory_path", str(default_memory_path())))
    storage_paths = [configured_path]
    home_fallback = default_memory_path()
    if home_fallback != configured_path:
        storage_paths.append(home_fallback)

    memory = None
    errors = []
    for path in storage_paths:
        try:
            memory = MemoryStore(path)
            if path != configured_path:
                ui.output(
                    "Primary memory location was not writable. Using fallback at\n"
                    f"{path}"
                )
            break
        except Exception as exc:  # pragma: no cover - defensive fallback
            errors.append((path, exc))

    if memory is None:
        ui.output(
            "Failed to open a persistent memory database; falling back to in-memory storage."
            " Future sessions will not retain history.\n"
            + "\n".join(f"Path {p}: {err}" for p, err in errors)
        )
        memory = InMemoryStore()
    assistant = CodingAssistant(memory, auto_run_code=config.get("auto_run_code", False), max_history=config.get("max_history", 20))

    last_code_block: Optional[str] = None

    while True:
        try:
            user_input = ui.prompt("")
        except (EOFError, KeyboardInterrupt):
            ui.output("Goodbye!")
            break

        if not user_input.strip():
            continue

        if user_input.startswith("/"):
            command = user_input.strip().lower()
            if command == "/help":
                show_help(ui)
                continue
            if command == "/quit":
                ui.output("Goodbye!")
                break
            if command == "/history":
                try:
                    interactions = memory.recent(limit=config.get("max_history", 10))
                except Exception as exc:
                    ui.output(f"Unable to read history: {exc}")
                    continue
                if not interactions:
                    ui.output("No history yet.")
                else:
                    for item in interactions:
                        ui.output(f"Q: {item.question}\nA: {item.answer}\n---")
                continue
            if command == "/run":
                handle_run(ui, last_code_block)
                continue
            if command == "/correct":
                correction = ui.prompt("Paste your correction or better answer:")
                assistant.register_feedback(correction)
                ui.output("Thanks! I'll incorporate this into similar future answers.")
                continue
            ui.output("Unknown command. Type /help for options.")
            continue

        answer = assistant.answer(user_input)
        ui.output(answer)
        blocks = extract_code_blocks(answer) or extract_code_blocks(user_input)
        if blocks:
            last_code_block = blocks[-1].code


if __name__ == "__main__":
    main()
