"""Utility helpers for text processing and similarity scoring."""

import re
from typing import Iterable, List, Set

PUNCTUATION_PATTERN = re.compile(r"[\.!?\-,;:\(\)\[\]\{\}]")


def clean_text(text: str) -> str:
    """Lowercase text and remove simple punctuation for easier matching."""
    lowered = text.lower()
    return PUNCTUATION_PATTERN.sub(" ", lowered)


def tokenize(text: str) -> List[str]:
    """Split cleaned text into tokens, dropping empty strings."""
    cleaned = clean_text(text)
    return [tok for tok in cleaned.split() if tok]


def jaccard_similarity(items_a: Iterable[str], items_b: Iterable[str]) -> float:
    """Compute Jaccard similarity between two token collections."""
    set_a: Set[str] = set(items_a)
    set_b: Set[str] = set(items_b)
    if not set_a and not set_b:
        return 1.0
    if not set_a or not set_b:
        return 0.0
    overlap = set_a.intersection(set_b)
    union = set_a.union(set_b)
    return len(overlap) / len(union)
