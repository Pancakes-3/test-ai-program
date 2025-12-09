"""Utilities for extracting and running code snippets safely."""
from __future__ import annotations

import ast
import json
import re
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple


CODE_BLOCK_RE = re.compile(r"```(\w+)?\n(.*?)```", re.DOTALL)


@dataclass
class CodeBlock:
    language: str
    code: str


@dataclass
class RunResult:
    success: bool
    stdout: str
    stderr: str
    returncode: int
    suggestion: Optional[str] = None


DANGEROUS_NODES = (
    ast.Import,
    ast.ImportFrom,
    ast.Global,
    ast.Nonlocal,
    ast.Delete,
)


def extract_code_blocks(text: str) -> List[CodeBlock]:
    """Extract fenced code blocks from text.

    Returns a list of CodeBlock items with detected language (default python).
    """
    blocks: List[CodeBlock] = []
    for match in CODE_BLOCK_RE.finditer(text):
        lang = match.group(1) or "python"
        code = match.group(2).strip()
        blocks.append(CodeBlock(language=lang.lower(), code=code))
    return blocks


def is_safe_python(code: str) -> Tuple[bool, Optional[str]]:
    """Perform a basic AST safety check to avoid obviously dangerous code."""
    try:
        tree = ast.parse(code)
    except SyntaxError as exc:  # pragma: no cover - passthrough
        return False, f"Syntax error before execution: {exc}"
    for node in ast.walk(tree):
        if isinstance(node, DANGEROUS_NODES):
            return False, "Code contains potentially dangerous operations (imports, delete, globals)."
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in {"open", "exec", "eval", "__import__"}:
                return False, "Code calls a disallowed builtin function."
    return True, None


def run_python(code: str, timeout: int = 10) -> RunResult:
    """Execute Python code in a temporary file and capture output."""
    safe, reason = is_safe_python(code)
    if not safe:
        return RunResult(success=False, stdout="", stderr=reason or "blocked", returncode=1, suggestion=None)
    with tempfile.TemporaryDirectory() as tmpdir:
        path = Path(tmpdir) / "snippet.py"
        path.write_text(code)
        try:
            completed = subprocess.run(
                ["python", "-u", str(path)],
                capture_output=True,
                text=True,
                timeout=timeout,
                check=False,
            )
            suggestion = suggest_fix_from_error(completed.stderr)
            return RunResult(
                success=completed.returncode == 0,
                stdout=completed.stdout,
                stderr=completed.stderr,
                returncode=completed.returncode,
                suggestion=suggestion,
            )
        except subprocess.TimeoutExpired:
            return RunResult(success=False, stdout="", stderr="Execution timed out", returncode=124, suggestion="Try optimizing or adding termination conditions.")


def suggest_fix_from_error(stderr: str) -> Optional[str]:
    """Heuristic suggestions based on common Python errors."""
    if "SyntaxError" in stderr:
        return "Check indentation, colons, and unmatched parentheses."
    if "NameError" in stderr:
        return "A variable is undefined; ensure it is defined before use."
    if "TypeError" in stderr:
        return "Check function arguments and data types for compatibility."
    if "AttributeError" in stderr:
        return "An object is missing an attribute; verify the attribute name and object type."
    return None


def format_run_result(result: RunResult) -> str:
    """Format run result for display."""
    lines = ["--- Execution Result ---"]
    lines.append(f"Return code: {result.returncode}")
    if result.stdout:
        lines.append("stdout:\n" + result.stdout.strip())
    if result.stderr:
        lines.append("stderr:\n" + result.stderr.strip())
    if result.suggestion:
        lines.append(f"Suggestion: {result.suggestion}")
    return "\n".join(lines)


def serialize_code_blocks(blocks: List[CodeBlock]) -> str:
    """Serialize code blocks to JSON for storage."""
    return json.dumps([block.__dict__ for block in blocks])


def deserialize_code_blocks(raw: str) -> List[CodeBlock]:
    """Deserialize JSON back into CodeBlock objects."""
    try:
        data = json.loads(raw)
        return [CodeBlock(**item) for item in data]
    except Exception:
        return []
