"""Basic configuration values for SimpleAI."""

from pathlib import Path

# Paths
DATA_DIR = Path("data")
MEMORY_PATH = DATA_DIR / "memory.jsonl"

# Bot settings
BOT_NAME = "SimpleAI"
SIMILARITY_THRESHOLD = 0.3

# Teach mode settings
TEACH_PREFIX = "teach:"
TEACH_TEMPLATE = "when i say \"{trigger}\", you reply with \"{reply}\""
