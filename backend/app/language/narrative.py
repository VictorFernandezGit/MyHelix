"""One short, plain-language overview per report, written by an LLM from approved results.

Input to the model is deliberately small: area names, approved wording, evidence strength
and counts. No rsIDs, no genotypes, no raw file. The model may only restate that.
Output is checked in code; if it fails every try, a plain template text is used instead.

Needs:  pip install google-genai      and GEMINI_API_KEY in backend/.env
"""
import json
import os
import re

from app.language.wording import lint_summary

MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")   # pick a current model in AI Studio
MAX_GRADE = 8.0                      # Flesch-Kincaid grade level
WORDS_MIN, WORDS_MAX = 80, 250

# domain key -> (name shown to the model, word that must appear if the area has findings)
DOMAINS = {
    "memory_retention": ("memory", "memory"),
    "focus_cognition": ("focus and thinking", "focus"),
    "stress_resiliency": ("handling stress", "stress"),
    "processing_speed": ("mental speed", "speed"),
}

SYSTEM = """You write a short overview of a person's DNA report for someone with no science background.
Use ONLY the information provided. Never mention anything that is not in it.

Style: write at about a 6th to 8th grade reading level. Short sentences. Everyday words.
Never use words like variant, allele, genotype, polymorphism, SNP, GWAS, or association
without first explaining them in plain words. Prefer "a small difference in your DNA".

Content rules:
- Say that findings describe patterns in large groups of people, not a prediction for this person.
- Never say a trait is caused by DNA, never diagnose, never give health or medical advice,
  never say anything is good or bad news.
- If something was "not tested", say that nothing can be said about it.
  Never present missing results as negative results.
- Say how strong the evidence is for each finding using the strength_of_evidence given.
- Mention that the panel is small and early-stage.
- One short paragraph per area that has findings, then one closing paragraph with the limits.
- 120 to 200 words total.

Return JSON only: {"overview": "..."}"""


def build_overview_input(results) -> dict:
    """results = list of EntryResult (anything with .status and .entry works)."""
    out: dict = {}
    for r in results:
        label = DOMAINS[r.entry["domain"]][0]
        d = out.setdefault(label, {"found": [], "readable": 0, "not_tested": 0})
        if r.status in ("carried", "not_carried"):
            d["readable"] += 1
        if r.status in ("no_call", "not_on_chip"):
            d["not_tested"] += 1
        if r.status == "carried":
            d["found"].append({
                "approved_wording": r.entry["summary"],
                "strength_of_evidence": r.entry["evidence_tier"],
            })
    return out


def _syllables(word: str) -> int:
    """Rough English syllable count: vowel groups, minus a silent final 'e'."""
    word = re.sub(r"[^a-z]", "", word.lower())
    if not word:
        return 0
    count = len(re.findall(r"[aeiouy]+", word))
    if word.endswith("e") and not word.endswith(("le", "ee")) and count > 1:
        count -= 1
    return max(count, 1)


def reading_grade(text: str) -> float:
    """Flesch-Kincaid grade level (US school grade). A rough guide, not a verdict."""
    sentences = max(len(re.findall(r"[.!?]+", text)), 1)
    words = re.findall(r"[A-Za-z']+", text)
    if not words:
        return 0.0
    syllables = sum(_syllables(w) for w in words)
    return 0.39 * len(words) / sentences + 11.8 * syllables / len(words) - 15.59


def problems(text: str, data: dict) -> list[str]:
    issues = [f"banned word: {w}" for w in lint_summary(text)]
    if re.search(r"\brs\d+", text, re.I):
        issues.append("mentions an rsID")
    if reading_grade(text) > MAX_GRADE:
        issues.append("reading level too high")
    if not WORDS_MIN <= len(text.split()) <= WORDS_MAX:
        issues.append("length")
    keyword_for = {label: kw for label, kw in DOMAINS.values()}
    for label, d in data.items():
        if d["found"] and keyword_for[label] not in text.lower():
            issues.append(f"missing area: {label}")
    return issues


def _gemini(system: str, user: str) -> str:
    """Call Google's Gemini API and return the reply text (a JSON string)."""
    from google import genai               # imported here so tests need no API key
    from google.genai import types

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    response = client.models.generate_content(
        model=MODEL,
        contents=user,
        config=types.GenerateContentConfig(
            system_instruction=system,
            temperature=0,
            max_output_tokens=2000,          # room for the model's own "thinking" tokens too
            response_mime_type="application/json",
        ),
    )
    return response.text


def generate_overview(results, llm=None, tries: int = 3) -> str | None:
    """Return a checked overview, or None if no attempt passed (use fallback_overview).

    llm = any function (system, user) -> reply text. Defaults to Gemini; tests pass a fake.
    """
    data = build_overview_input(results)
    llm = llm or _gemini
    for _ in range(tries):
        try:
            text = json.loads(llm(SYSTEM, json.dumps(data)))["overview"]
        except Exception:
            continue
        if not problems(text, data):
            return text
    return None


def fallback_overview(results) -> str:
    found = [r.entry["summary"] for r in results if r.status == "carried"]
    body = " ".join(found) if found else "None of the differences in our small panel were found in your file."
    return (body + " These are patterns seen in large groups of people, not predictions for you. "
            "Anything marked as not tested says nothing either way.")
