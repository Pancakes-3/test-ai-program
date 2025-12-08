"""Persistent memory for SimpleAI conversations."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List

from config import DATA_DIR, MEMORY_PATH


class MemoryManager:
    """Manage saving and loading conversation turns for the bot."""

    def __init__(self) -> None:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        MEMORY_PATH.touch(exist_ok=True)

    def save_turn(self, user_text: str, bot_text: str, timestamp: datetime) -> None:
        """Append a single conversation turn as JSON."""
        record = {
            "timestamp": timestamp.isoformat(),
            "user": user_text,
            "bot": bot_text,
        }
        with MEMORY_PATH.open("a", encoding="utf-8") as f:
            json.dump(record, f)
            f.write("\n")

    def load_all(self) -> List[Dict[str, str]]:
        """Load every stored turn into memory."""
        turns: List[Dict[str, str]] = []
        if not MEMORY_PATH.exists():
            return turns
        with MEMORY_PATH.open("r", encoding="utf-8") as f:
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
    print("Saved a turn. Current stats:", mm.get_stats())
