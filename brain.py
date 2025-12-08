"""The simple rule-based brain for the chatbot."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from config import BOT_NAME, DEFAULT_KNOWLEDGE, SIMILARITY_THRESHOLD, TEACH_PREFIX
from memory import MemoryManager
from utils import jaccard_similarity, normalize_math_expression, safe_eval_math, tokenize


@dataclass
class MemoryEntry:
    """In-memory representation of a single stored turn."""

    user: str
    bot: str
    timestamp: str


class Brain:
    """Core logic for generating responses using rules and memory lookup."""

    def __init__(self, memory_manager: MemoryManager) -> None:
        self.memory_manager = memory_manager
        self.memories: List[MemoryEntry] = [
            MemoryEntry(user=m.get("user", ""), bot=m.get("bot", ""), timestamp=m.get("timestamp", ""))
            for m in memory_manager.load_all()
        ]
        self.taught_replies: Dict[str, str] = self._load_teachings(self.memories)
        self._seed_default_knowledge()

    def _seed_default_knowledge(self) -> None:
        """Preload a handful of helpful replies so the bot feels less empty."""
        for trigger, reply in DEFAULT_KNOWLEDGE:
            self.taught_replies.setdefault(trigger, reply)

    def _load_teachings(self, memories: List[MemoryEntry]) -> Dict[str, str]:
        """Extract explicit teach directives from past memories."""
        teachings: Dict[str, str] = {}
        for mem in memories:
            trigger, reply = self._parse_teach(mem.user)
            if trigger and reply:
                teachings[trigger] = reply
        return teachings

    def _parse_teach(self, text: str) -> Tuple[Optional[str], Optional[str]]:
        """Parse teaching instructions of the form 'teach: when I say "X", you reply with "Y"'."""
        if not text.lower().startswith(TEACH_PREFIX):
            return None, None
        remainder = text[len(TEACH_PREFIX):].strip()
        pattern = r"when i say \"(.+?)\", you reply with \"(.+?)\""
        match = re.search(pattern, remainder, flags=re.IGNORECASE)
        if match:
            trigger = match.group(1).strip()
            reply = match.group(2).strip()
            return trigger, reply
        return None, None

    def update_memory(self, user_text: str, bot_text: str, timestamp: datetime) -> None:
        """Persist a new turn and update in-memory caches."""
        self.memory_manager.save_turn(user_text, bot_text, timestamp)
        new_entry = MemoryEntry(user=user_text, bot=bot_text, timestamp=timestamp.isoformat())
        self.memories.append(new_entry)
        trigger, reply = self._parse_teach(user_text)
        if trigger and reply:
            self.taught_replies[trigger] = reply

    def generate_reply(self, message: str) -> str:
        """Generate a reply using teaching, memory similarity, and simple rules."""
        learned_response = self._handle_learning_intent(message)
        if learned_response:
            return learned_response

        teach_trigger, teach_reply = self._parse_teach(message)
        if teach_trigger and teach_reply:
            self.taught_replies[teach_trigger] = teach_reply
            return f"Got it. When you say \"{teach_trigger}\" I'll reply with \"{teach_reply}\"."

        taught_response = self._lookup_taught_reply(message)
        if taught_response:
            return taught_response

        math_answer = self._try_math(message)
        if math_answer:
            return math_answer

        similar_reply = self._retrieve_similar_reply(message)
        if similar_reply:
            return similar_reply

        return self._rule_based_reply(message)

    def _handle_learning_intent(self, message: str) -> Optional[str]:
        """Detect loose 'remember/learn' phrasing and turn it into a taught reply."""
        lowered = message.lower()
        learning_words = ("remember", "learn", "note", "save")
        if not any(word in lowered for word in learning_words):
            return None

        # Patterns like "remember that cats are playful" -> trigger "cats" reply "Cats are playful."
        match_is = re.search(r"remember(?: that)?\s+(.+?)\s+(is|are|means)\s+(.+)", lowered)
        if match_is:
            trigger = match_is.group(1).strip()
            meaning = match_is.group(3).strip()
            reply = meaning[0].upper() + meaning[1:] if meaning else meaning
            self.taught_replies[trigger] = reply
            return f"Okay, I'll remember that {trigger} is {reply}."

        # Patterns like "remember this: ..." -> echo back later.
        match_this = re.search(r"remember this[:\-]?\s*(.+)", message, flags=re.IGNORECASE)
        if match_this:
            fact = match_this.group(1).strip()
            if fact:
                trigger = fact
                reply = f"You told me: {fact}"
                self.taught_replies[trigger] = reply
                return "Noted! I'll keep that in mind."

        # Patterns like "learn that when I say X you answer Y" without the teach prefix.
        match_when = re.search(r"when i say \"(.+?)\"[, ]+you (?:should )?reply with \"(.+?)\"", message, flags=re.IGNORECASE)
        if match_when:
            trigger = match_when.group(1).strip()
            reply = match_when.group(2).strip()
            if trigger and reply:
                self.taught_replies[trigger] = reply
                return f"Understood. I'll reply with \"{reply}\" when you say \"{trigger}\"."

        return None

    def _lookup_taught_reply(self, message: str) -> Optional[str]:
        """Check for a manually taught response."""
        for trigger, reply in self.taught_replies.items():
            if jaccard_similarity(tokenize(trigger), tokenize(message)) >= 0.6:
                return reply
        return None

    def _try_math(self, message: str) -> Optional[str]:
        """Attempt to parse and evaluate a simple math expression from the message."""
        expr = normalize_math_expression(message)
        if not expr:
            return None
        result = safe_eval_math(expr)
        if result is None:
            return None
        # Keep integers tidy and floats rounded.
        if isinstance(result, float) and result.is_integer():
            result = int(result)
        else:
            result = round(result, 6)
        return f"I worked that out: {expr} = {result}"

    def _retrieve_similar_reply(self, message: str) -> Optional[str]:
        """Find the most similar past user message and reuse its response if above threshold."""
        message_tokens = tokenize(message)
        best_score = 0.0
        best_reply: Optional[str] = None
        for mem in self.memories:
            past_tokens = tokenize(mem.user)
            score = jaccard_similarity(message_tokens, past_tokens)
            if score > best_score:
                best_score = score
                best_reply = mem.bot
        if best_score >= SIMILARITY_THRESHOLD and best_reply:
            return f"I remember we talked about this before. {best_reply}"
        return None

    def _rule_based_reply(self, message: str) -> str:
        """Simple keyword-driven replies to keep conversation engaging."""
        tokens = tokenize(message)

        greetings = {"hello", "hi", "hey", "greetings"}
        farewells = {"bye", "goodbye", "goodnight", "see", "later"}

        if any(word in greetings for word in tokens):
            return f"Hello! I'm {BOT_NAME}. How can I help today?"
        if "how" in tokens and "you" in tokens:
            return "I'm feeling ready to chat and keep learning!"
        if "name" in tokens:
            return f"I'm called {BOT_NAME}, your local Python chat buddy."
        if "who" in tokens and ("made" in tokens or "created" in tokens):
            return f"I was built as a simple local program in Python. Nothing online, just me and your terminal!"
        if any(word in farewells for word in tokens):
            return "Talk to you later!"

        # Default behavior: acknowledge and encourage more details.
        return (
            "Got it! I'm processing that with what I know. "
            "You can also teach me by saying things like 'remember cats are playful' or 'learn that when I say \"X\" you reply with \"Y\"'."
        )


if __name__ == "__main__":
    mm = MemoryManager()
    brain = Brain(mm)
    reply = brain.generate_reply("Hello there")
    print("Sample reply:", reply)
