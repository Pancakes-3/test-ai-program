"""Persistent memory store for the local coding assistant."""
from __future__ import annotations

import json
import sqlite3
import time
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple

from code_tools import CodeBlock, deserialize_code_blocks, serialize_code_blocks
from nlp_utils import build_vector_space, top_k_similar, transform_texts


@dataclass
class Interaction:
    question: str
    answer: str
    code_blocks: List[CodeBlock]
    feedback: Optional[str] = None
    correction: Optional[str] = None
    created_at: float = 0.0


class MemoryStore:
    """Stores interactions and supports similarity search."""

    def __init__(self, db_path: Path):
        self.db_path = Path(db_path)
        self._ensure_schema()

    def _ensure_schema(self) -> None:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS interactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    created_at REAL,
                    question TEXT,
                    answer TEXT,
                    code_blocks TEXT,
                    feedback TEXT,
                    correction TEXT
                )
                """
            )
            conn.commit()

    def store_interaction(
        self,
        question: str,
        answer: str,
        code_blocks: List[CodeBlock],
        feedback: Optional[str] = None,
        correction: Optional[str] = None,
    ) -> None:
        payload = (
            time.time(),
            question,
            answer,
            serialize_code_blocks(code_blocks),
            feedback,
            correction,
        )
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "INSERT INTO interactions (created_at, question, answer, code_blocks, feedback, correction) VALUES (?, ?, ?, ?, ?, ?)",
                payload,
            )
            conn.commit()

    def recent(self, limit: int = 10) -> List[Interaction]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "SELECT question, answer, code_blocks, feedback, correction, created_at FROM interactions ORDER BY created_at DESC LIMIT ?",
                (limit,),
            )
            rows = cursor.fetchall()
        return [self._row_to_interaction(row) for row in rows]

    def _row_to_interaction(self, row: Tuple) -> Interaction:
        question, answer, code_raw, feedback, correction, created_at = row
        return Interaction(
            question=question,
            answer=answer,
            code_blocks=deserialize_code_blocks(code_raw or "[]"),
            feedback=feedback,
            correction=correction,
            created_at=created_at,
        )

    def find_similar(self, question: str, k: int = 5) -> List[Tuple[Interaction, float]]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "SELECT question, answer, code_blocks, feedback, correction, created_at FROM interactions"
            )
            rows = cursor.fetchall()
        if not rows:
            return []
        interactions = [self._row_to_interaction(row) for row in rows]
        questions = [item.question for item in interactions]
        space, model = build_vector_space(questions)
        query_vector = transform_texts([question], model, space.vocabulary_)[0]
        similar_items = top_k_similar(space, query_vector, k=k)
        return [(interactions[item.index], item.score) for item in similar_items]


def load_config(path: Path) -> dict:
    """Load JSON config safely."""
    try:
        return json.loads(path.read_text())
    except Exception:
        return {}
