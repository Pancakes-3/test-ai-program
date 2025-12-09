"""Core reasoning engine for the local coding assistant."""
from __future__ import annotations

import textwrap
from dataclasses import dataclass
from typing import List, Optional

from code_tools import CodeBlock, extract_code_blocks
from memory import Interaction, MemoryStore


@dataclass
class ResponsePlan:
    intent: str
    explanation: str
    code: Optional[str] = None
    language: str = "python"


class CodingAssistant:
    """Rule-driven assistant that learns from feedback and retrieval."""

    def __init__(self, memory: MemoryStore, auto_run_code: bool = False, max_history: int = 20):
        self.memory = memory
        self.auto_run_code = auto_run_code
        self.max_history = max_history
        self.last_interaction: Optional[Interaction] = None

    def answer(self, question: str) -> str:
        """Produce an answer string for a user question."""
        similar = self.memory.find_similar(question, k=3)
        plan = self._plan_response(question, similar)
        answer_parts: List[str] = []
        if similar:
            tips = self._format_similar(similar)
            answer_parts.append(tips)
        answer_parts.append(plan.explanation)
        if plan.code:
            answer_parts.append(f"```{plan.language}\n{plan.code}\n```")
        final_answer = "\n\n".join(part for part in answer_parts if part)
        blocks = extract_code_blocks(final_answer)
        self.memory.store_interaction(question, final_answer, blocks)
        self.last_interaction = Interaction(question=question, answer=final_answer, code_blocks=blocks)
        return final_answer

    def register_feedback(self, correction_text: str) -> None:
        """Persist feedback linked to the last interaction."""
        if not self.last_interaction:
            return
        self.memory.store_interaction(
            question=self.last_interaction.question,
            answer=self.last_interaction.answer,
            code_blocks=self.last_interaction.code_blocks,
            feedback="user correction",
            correction=correction_text,
        )

    def _plan_response(self, question: str, similar: List[tuple]) -> ResponsePlan:
        lowered = question.lower()
        if any(keyword in lowered for keyword in ["traceback", "exception", "error", "stacktrace", "stack trace"]):
            return self._debug_plan(question)
        if any(keyword in lowered for keyword in ["write", "implement", "function", "class", "algorithm"]):
            return self._code_gen_plan(question)
        if any(keyword in lowered for keyword in ["explain", "why", "what does", "how does"]):
            return self._explain_plan(question)
        return ResponsePlan(intent="generic", explanation=self._generic_template(question))

    def _format_similar(self, items: List[tuple]) -> str:
        lines = ["Found related past interactions:"]
        for interaction, score in items:
            snippet = interaction.answer[:200].replace("\n", " ")
            lines.append(f"- Similarity {score:.2f}: {snippet}...")
            if interaction.correction:
                lines.append(f"  Correction noted: {interaction.correction[:200]}")
        return "\n".join(lines)

    def _debug_plan(self, question: str) -> ResponsePlan:
        explanation = textwrap.dedent(
            f"""I noticed this looks like a debugging request.\n"
            f"Common debugging steps:\n"
            f"1. Identify the line with the error.\n"
            f"2. Confirm variables are defined and of the expected type.\n"
            f"3. Reproduce with a minimal example.\n"
            f"4. Add print/logging to inspect values.\n\n"
            f"If you paste the traceback with the relevant code I can suggest a fix."""
        ).strip()
        return ResponsePlan(intent="debug", explanation=explanation)

    def _code_gen_plan(self, question: str) -> ResponsePlan:
        explanation = textwrap.dedent(
            """Here's a step-by-step approach you can adapt:\n"
            "- Clarify the inputs and outputs.\n"
            "- Start with a small, testable helper.\n"
            "- Handle edge cases explicitly.\n"
            "- Add a short docstring."""
        ).strip()
        code = textwrap.dedent(
            """
            def solve_problem(inputs):
                '''Describe the function's purpose.'''
                # TODO: implement logic
                return inputs
            """
        ).strip()
        return ResponsePlan(intent="code", explanation=explanation, code=code)

    def _explain_plan(self, question: str) -> ResponsePlan:
        explanation = textwrap.dedent(
            """Here's an explanation based on common patterns:\n"
            "- Break the concept into smaller parts.\n"
            "- Use examples to ground the idea.\n"
            "- Compare with related concepts when helpful.\n\n"
            "If you provide code or an error message, I can tailor the explanation further."""
        ).strip()
        return ResponsePlan(intent="explain", explanation=explanation)

    def _generic_template(self, question: str) -> str:
        return textwrap.dedent(
            f"""I can help with code, debugging, or explanations.\n"
            f"You asked: '{question}'.\n"
            f"Try sharing code snippets or errors for a more specific answer."""
        ).strip()
