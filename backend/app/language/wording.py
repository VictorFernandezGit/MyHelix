"""Word rules shared by the whole language layer.

Used when panel summaries are drafted (build time) and when the report overview is
generated (every upload). Patterns match whole words, so "because" is not flagged for
"cause". Add patterns as you find new problems: this list is a safety net, not a
substitute for a person reading the text.
"""
import re

BANNED = [
    r"\bcaus(?:e|es|ed|ing)\b", r"\bgene for\b", r"\bdiagnos\w*", r"\bdisorders?\b",
    r"\bdiseases?\b", r"\bpredispos\w*", r"\brisk of\b", r"\bprotect\w*", r"\bboost\w*",
    r"\bimpair\w*", r"\bdeficits?\b", r"\btreatments?\b", r"\btreating\b", r"\byou have\b",
    r"\bbecause of\b", r"\bpathways?\b", r"\bneurotransmitters?\b", r"\bdopamine\b",
    r"\bserotonin\b", r"\bproteins?\b", r"\bexpression\b",
]
_COMPILED = [re.compile(p, re.IGNORECASE) for p in BANNED]


def lint_summary(text: str) -> list[str]:
    """Return the banned words or phrases found in text (empty list = clean)."""
    return [m.group(0).lower() for rx in _COMPILED for m in rx.finditer(text)]
