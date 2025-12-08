"""Basic configuration values for SimpleAI."""
from pathlib import Path
import os


def _candidate_data_dirs() -> list[Path]:
    """Return preferred data directories, ordered by priority."""
    dirs = []
    env_dir = os.environ.get("SIMPLEAI_DATA_DIR")
    if env_dir:
        dirs.append(Path(env_dir).expanduser())
    # Try storing next to the code for portability, then fall back to home.
    dirs.append(Path(__file__).resolve().parent / "data")
    dirs.append(Path.home() / ".simpleai")
    return dirs


DATA_DIR_CANDIDATES = _candidate_data_dirs()

# Bot settings
BOT_NAME = "SimpleAI"
SIMILARITY_THRESHOLD = 0.3

# Teach mode settings
TEACH_PREFIX = "teach:"
TEACH_TEMPLATE = "when i say \"{trigger}\", you reply with \"{reply}\""

# Default lightweight knowledge so the bot starts with a few helpful answers.
DEFAULT_KNOWLEDGE: list[tuple[str, str]] = [
    ("what is your name", f"I'm {BOT_NAME}, your local Python chat buddy."),
    ("who created you", "I was built as a simple local Python program that learns from our chats."),
    ("what can you do", "I can chat, remember things you teach me, recall past talks, and solve small math problems offline."),
    ("help", "You can say hello, ask questions, or teach me new replies by telling me to remember or learn something."),
]
