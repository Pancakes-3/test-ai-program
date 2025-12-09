"""Persistent memory for SimpleAI conversations."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List

from config import DATA_DIR_CANDIDATES


class MemoryManager:
    """Manage saving and loading conversation turns for the bot."""

    def __init__(self) -> None:
        self.data_dir, self.memory_path = self._pick_storage_paths()
        self.memory_path.touch(exist_ok=True)

    def _pick_storage_paths(self) -> tuple[Path, Path]:
        """Select the first writable data directory, falling back gracefully."""
        errors = []
        for candidate in DATA_DIR_CANDIDATES:
            try:
                candidate.mkdir(parents=True, exist_ok=True)
                test_file = candidate / "__write_test__"
                test_file.write_text("ok", encoding="utf-8")
                test_file.unlink(missing_ok=True)
                return candidate, candidate / "memory.jsonl"
            except OSError as exc:  # PermissionError and similar
                errors.append((candidate, exc))
                continue
        # If none succeeded, raise a helpful error
        message_lines = [
            "Unable to find a writable data directory. Tried:"
        ] + [f"- {path}: {exc}" for path, exc in errors]
        raise OSError("\n".join(message_lines))

    def save_turn(self, user_text: str, bot_text: str, timestamp: datetime) -> None:
        """Append a single conversation turn as JSON."""
        record = {
            "timestamp": timestamp.isoformat(),
            "user": user_text,
            "bot": bot_text,
        }
        with self.memory_path.open("a", encoding="utf-8") as f:
            json.dump(record, f)
            f.write("\n")

    def load_all(self) -> List[Dict[str, str]]:
        """Load every stored turn into memory."""
        turns: List[Dict[str, str]] = []
        if not self.memory_path.exists():
            return turns
        with self.memory_path.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    turns.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
        return turns

    def get_stats(self) -> Dict[str, str]:
        """Return quick stats about the stored conversations."""
        turns = self.load_all()
        total_turns = len(turns)
        unique_user_messages = len({t.get("user", "") for t in turns})
        dates = [t.get("timestamp") for t in turns if t.get("timestamp")]
        first_date = min(dates) if dates else "n/a"
        last_date = max(dates) if dates else "n/a"
        return {
            "total_turns": total_turns,
            "unique_user_messages": unique_user_messages,
            "first_timestamp": first_date,
            "last_timestamp": last_date,
        }


if __name__ == "__main__":
    # quick self-check
    mm = MemoryManager()
    now = datetime.utcnow()
    mm.save_turn("test user", "test bot", now)
    print("Saved a turn to", mm.memory_path)
    print("Current stats:", mm.get_stats())
