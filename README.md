# Local Terminal Coding Assistant

A lightweight, offline coding assistant designed to answer programming questions, generate code snippets, and help debug errors directly from your terminal. It uses no external AI APIs or large language models—instead it combines rule-based reasoning, code execution tools, and a simple retrieval-based learning system that improves with your feedback.

## Features
- Interactive REPL with helpful commands (`/help`, `/run`, `/correct`, `/history`, `/quit`).
- Code block extraction and safe Python execution with captured output.
- Debugging suggestions based on common error patterns.
- Persistent memory (SQLite) that stores past interactions and your corrections.
- Similarity search using TF-IDF (scikit-learn when available, otherwise a built-in fallback).
- Optional Rich-powered terminal formatting.

## Installation
1. Ensure Python 3.8+ is installed.
2. Clone or copy this repository.
3. Optional but recommended: install Rich and scikit-learn for nicer output and vectorization:
   ```bash
   pip install rich scikit-learn
   ```
4. Confirm `config.json` to adjust settings like history length or auto-run behavior.

The assistant works without any external dependencies; optional libraries simply improve quality of life.

## Usage
Run the assistant from the project root:
```bash
python main.py
```

Type natural language questions or paste code. Use fenced code blocks (```) to mark snippets.

### Commands
- `/help` — Show available commands.
- `/history` — Display recent questions and answers stored in memory.
- `/run` — Execute the last seen code block in a sandboxed temp file (Python only).
- `/correct` — Provide a better answer or fixed code; the assistant stores this correction and prefers it in future similar questions.
- `/quit` — Exit the assistant.

## Learning and Memory
- Interactions are stored locally in `memory.db` (configurable in `config.json`).
- When you supply a correction via `/correct`, the assistant links it to the last interaction.
- On new questions, it performs a similarity search over prior questions and surfaces helpful corrections or patterns.
- No data leaves your machine.

## Configuration
`config.json` controls defaults:
- `use_sklearn` — Whether to use scikit-learn when available for TF-IDF.
- `max_history` — Number of history items to show.
- `auto_run_code` — Reserved for future auto-execution behavior.
- `memory_path` — Location of the SQLite database.
- `rich_output` — Toggle Rich formatting.

## Limitations
- Not a full LLM; reasoning is rule-based with lightweight retrieval.
- Currently focused on Python. Other languages can be added by extending `code_tools.py` and intent rules.
- Sandboxing is basic; avoid running untrusted code.

## Future Ideas
- Add language-specific runners for JavaScript or Java.
- Extend similarity search with additional signals.
- Build a richer TUI or web-based interface using the same core modules.
