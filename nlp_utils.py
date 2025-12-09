"""Utilities for lightweight NLP tasks and similarity search.

This module intentionally avoids large language model dependencies. It exposes
simple tokenization, TF-IDF style vectorization, and cosine similarity helpers.
When scikit-learn is available it will be used for convenience; otherwise a
pure-Python fallback keeps the assistant functional.
"""
from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Iterable, List, Optional, Sequence, Tuple

try:
    from sklearn.feature_extraction.text import TfidfVectorizer  # type: ignore
    from sklearn.metrics.pairwise import cosine_similarity  # type: ignore
    SKLEARN_AVAILABLE = True
except Exception:  # pragma: no cover - optional dependency
    TfidfVectorizer = None
    cosine_similarity = None
    SKLEARN_AVAILABLE = False


_WORD_RE = re.compile(r"[A-Za-z_][A-Za-z0-9_]+")


def simple_tokenize(text: str) -> List[str]:
    """Tokenize text into lowercased word tokens.

    The tokenizer is intentionally straightforward to keep dependencies light.
    """
    return _WORD_RE.findall(text.lower())


@dataclass
class VectorSpace:
    """Container for vector data and associated vocabulary."""

    matrix: List[List[float]]
    vocabulary_: List[str]

    def cosine_similarities(self, other: List[float]) -> List[float]:
        """Compute cosine similarity between each row in the matrix and vector.

        Args:
            other: Vector represented as a list of floats.

        Returns:
            A list of cosine similarity scores in the same order as rows.
        """
        results = []
        for row in self.matrix:
            results.append(_cosine(row, other))
        return results


def _cosine(a: Sequence[float], b: Sequence[float]) -> float:
    """Compute cosine similarity between two sparse-friendly vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


class LightweightVectorizer:
    """A minimal TF-IDF style vectorizer.

    The implementation is intentionally compact; it supports just enough of the
    scikit-learn API to make the rest of the assistant code simpler.
    """

    def __init__(self):
        self.vocab: List[str] = []
        self.idf: List[float] = []

    def fit_transform(self, docs: Iterable[str]) -> VectorSpace:
        tokenized = [simple_tokenize(doc) for doc in docs]
        vocab_set = {tok for doc in tokenized for tok in doc}
        self.vocab = sorted(vocab_set)
        doc_freq = {term: 0 for term in self.vocab}
        for doc in tokenized:
            for term in set(doc):
                doc_freq[term] += 1
        n_docs = len(tokenized)
        self.idf = [math.log((1 + n_docs) / (1 + doc_freq[t])) + 1 for t in self.vocab]
        matrix: List[List[float]] = []
        for doc in tokenized:
            counts = {t: 0 for t in self.vocab}
            for term in doc:
                counts[term] += 1
            max_count = max(counts.values()) if counts else 1
            tfidf = [counts[t] / max_count * self.idf[i] for i, t in enumerate(self.vocab)]
            matrix.append(tfidf)
        return VectorSpace(matrix=matrix, vocabulary_=self.vocab)

    def transform(self, docs: Iterable[str]) -> List[List[float]]:
        tokenized = [simple_tokenize(doc) for doc in docs]
        matrix: List[List[float]] = []
        for doc in tokenized:
            counts = {t: 0 for t in self.vocab}
            for term in doc:
                if term in counts:
                    counts[term] += 1
            max_count = max(counts.values()) if counts else 1
            tfidf = [counts[t] / max_count * self.idf[i] for i, t in enumerate(self.vocab)]
            matrix.append(tfidf)
        return matrix


@dataclass
class SimilarItem:
    index: int
    score: float


def build_vector_space(texts: List[str]) -> Tuple[VectorSpace, Optional[object]]:
    """Create a vector space from a list of texts.

    If scikit-learn is available, return its vectorizer for reuse; otherwise
    return the custom lightweight implementation.
    """
    if SKLEARN_AVAILABLE:
        vectorizer = TfidfVectorizer(tokenizer=simple_tokenize, lowercase=True)
        matrix = vectorizer.fit_transform(texts)
        space = VectorSpace(matrix=matrix.toarray().tolist(), vocabulary_=vectorizer.get_feature_names_out().tolist())
        return space, vectorizer
    custom = LightweightVectorizer()
    space = custom.fit_transform(texts)
    return space, custom


def transform_texts(texts: List[str], model: Optional[object], vocabulary: List[str]) -> List[List[float]]:
    """Transform texts using either sklearn vectorizer or custom one."""
    if SKLEARN_AVAILABLE and model is not None and hasattr(model, "transform"):
        transformed = model.transform(texts)
        return transformed.toarray().tolist()
    if isinstance(model, LightweightVectorizer):
        return model.transform(texts)
    # Fallback: rebuild a simple binary matrix using provided vocabulary
    vectors = []
    for text in texts:
        tokens = set(simple_tokenize(text))
        vectors.append([1.0 if tok in tokens else 0.0 for tok in vocabulary])
    return vectors


def top_k_similar(space: VectorSpace, query_vector: List[float], k: int = 5) -> List[SimilarItem]:
    """Compute top-k similar items given a prepared vector space."""
    scores = space.cosine_similarities(query_vector)
    indexed = [SimilarItem(index=i, score=s) for i, s in enumerate(scores)]
    indexed.sort(key=lambda item: item.score, reverse=True)
    return indexed[:k]
