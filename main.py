"""Entry point for the SimpleAI chatbot."""

from __future__ import annotations

from datetime import datetime
import sys
import traceback
from brain import Brain
from memory import MemoryManager
from config import BOT_NAME


def print_help() -> None:
    """Display available commands to the user."""
    print(
        "Commands:\n"
        "  help  - show this message\n"
        "  stats - show memory statistics\n"
        "  quit  - exit the chat\n"
        "  teach: when I say \"X\", you reply with \"Y\" - teach a custom reply\n"
    )


def main() -> None:
    """Run the interactive chat loop."""
    memory = MemoryManager()
    brain = Brain(memory)

    print("Welcome to SimpleAI. Type 'quit' to exit, 'help' for options.")
    print(f"Memory file: {memory.memory_path}")

    def pause_if_interactive(message: str) -> None:
        """Wait for Enter when stdin is a TTY to avoid instant window closing."""
        if sys.stdin is not None and sys.stdin.isatty():
            try:
                input(message)
            except Exception:
                pass

    while True:
        try:
            user_text = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            pause_if_interactive("Press Enter to close...")
            break

        if not user_text:
            continue
        lower_text = user_text.lower()

        if lower_text == "quit":
            print("Goodbye!")
            pause_if_interactive("Press Enter to close...")
            break
        if lower_text == "help":
            print_help()
            continue
        if lower_text == "stats":
            stats = memory.get_stats()
            print(
                f"Total turns: {stats['total_turns']}, unique user messages: {stats['unique_user_messages']}, "
                f"first: {stats['first_timestamp']}, last: {stats['last_timestamp']}"
            )
            continue

        reply = brain.generate_reply(user_text)
        print(f"{BOT_NAME}: {reply}")
        brain.update_memory(user_text, reply, datetime.utcnow())


if __name__ == "__main__":
    try:
        main()
    except Exception:
        print("An unexpected error occurred. See details below and press Enter to close if needed.")
        traceback.print_exc()
        if sys.stdin is not None and sys.stdin.isatty():
            try:
                input("Press Enter to close...")
            except Exception:
                pass
