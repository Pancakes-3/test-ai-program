"""Entry point for the SimpleAI chatbot."""

from __future__ import annotations

from datetime import datetime
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

    while True:
        try:
            user_text = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break

        if not user_text:
            continue
        lower_text = user_text.lower()

        if lower_text == "quit":
            print("Goodbye!")
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
    main()
