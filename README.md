# SimpleAI

A tiny, fully local chatbot inspired by ChatGPT. It uses only Python's standard library, stores every conversation turn to disk,
and reuses past chats to sound slightly smarter over time.

## Requirements
- Python 3 (standard library only; no extra packages needed)

## Running the chat
Run SimpleAI from a terminal so the window stays open for interaction:
```bash
python main.py
```

On startup you'll see:
```
Welcome to SimpleAI. Type 'quit' to exit, 'help' for options.
```

Then type messages and read the replies. If you accidentally start it in a way that immediately closes the window, launch it from
an open terminal instead so you can see the prompts (the program will now pause on exit when it detects an immediate close).

## Commands
- `help` – show available commands.
- `stats` – print basic memory stats (total turns, distinct user messages, first/last timestamps).
- `quit` – exit the chat.
- `teach: when I say "X", you reply with "Y"` – teach a custom reply. The bot will reuse it when you later say something similar to `X`.
- You can also say things like `remember cats are playful` or `learn that when I say "coffee" you reply with "fresh brew time"` and the bot will store that knowledge.

## How it works
- **Memory**: Every turn is appended to a JSON Lines file named `memory.jsonl`. The program tries a few storage locations in order: a `data/` folder next to the code, a folder you provide via `SIMPLEAI_DATA_DIR`, and finally a per-user directory at `~/.simpleai` so that permission errors don't crash the app. Each line contains `timestamp`, `user`, and `bot` fields. The chosen folder and file are created automatically if missing and writable.
- **Brain**: Incoming messages are tokenized and compared to past user messages using a simple Jaccard similarity. If a close match is found, the previous reply is reused with a short preface. Otherwise, keyword rules handle greetings, farewells, and basic questions. A tiny built-in knowledge base plus flexible "remember/learn" phrasing make it feel less rigid, it will restate remembered facts when you ask about them, and it can solve small arithmetic questions locally.
- **Teaching**: You can teach explicit mappings with the `teach:` prefix. These are stored in memory alongside normal turns and loaded on startup.

## Limitations
- This is a toy chatbot, not a real language model.
- Understanding is keyword/similarity-based; replies may be repetitive or off-target.
- Memory grows without bounds; consider cleaning `memory.jsonl` if it gets large.
- Math is intentionally simple and limited to basic arithmetic with numbers.

Enjoy chatting with your local SimpleAI!
