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
