import re
import requests


# ================= CONFIG =================
class TextQualityConfig:
    """
    Configuration for text quality analysis.
    """

    SEPARATOR = "$n$"

    MAX_ERROR_TEXT_LENGTH = 50

    IGNORED_PATTERNS = ["http", "www", ".com"]

    IGNORED_MESSAGES = [
        "possible spelling mistake found"
    ]

    MAX_SUGGESTIONS = 3

    LANGUAGE_TOOL_URL = "https://api.languagetool.org/v2/check"


# ================= UTILITIES =================
def clean_text(text: str) -> str:
    """
    Normalizes text by removing separators and extra whitespace.
    """
    text = text.replace(TextQualityConfig.SEPARATOR, " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ================= VALIDATION =================
def is_valid_grammar_issue(issue: dict) -> bool:
    """
    Filters out low-value or noisy grammar issues.
    """

    message = issue.get("message", "").lower()
    error_text = issue.get("error_text", "").strip()

    # Ignore empty text
    if not error_text:
        return False

    # Ignore URLs
    if any(x in error_text.lower() for x in TextQualityConfig.IGNORED_PATTERNS):
        return False

    # Ignore very long text
    if len(error_text) > TextQualityConfig.MAX_ERROR_TEXT_LENGTH:
        return False

    # Ignore name-like tokens (e.g., "John")
    if error_text.istitle() and len(error_text.split()) == 1:
        return False

    # Ignore weak / noisy messages
    if any(msg in message for msg in TextQualityConfig.IGNORED_MESSAGES):
        return False

    return True


# ================= GRAMMAR CHECK =================
def check_grammar_api(text: str):
    """
    Uses LanguageTool API to detect grammar issues.
    """

    clean = clean_text(text)

    try:
        response = requests.post(
            TextQualityConfig.LANGUAGE_TOOL_URL,
            data={
                "text": clean,
                "language": "en-US"
            }
        )

        matches = response.json().get("matches", [])

        results = []
        seen = set()

        for match in matches:
            error_text = clean[
                match["offset"]: match["offset"] + match["length"]
            ]

            issue = {
                "message": match.get("message"),
                "error_text": error_text,
                "suggestions": [
                    r.get("value")
                    for r in match.get("replacements", [])[:TextQualityConfig.MAX_SUGGESTIONS]
                ]
            }

            key = (issue["message"], issue["error_text"])

            if key in seen:
                continue

            if is_valid_grammar_issue(issue):
                seen.add(key)
                results.append(issue)

        return results

    except Exception:
        # Fail-safe: return empty instead of breaking pipeline
        return []


# ================= UNPROFESSIONAL CONTENT =================
def check_unprofessional(text: str):
    """
    Detects informal/unprofessional elements (e.g., emojis).
    """

    clean = clean_text(text)

    issues = []

    emoji_pattern = re.compile(
        "["
        u"\U0001F600-\U0001F64F"
        u"\U0001F300-\U0001F5FF"
        u"\U0001F680-\U0001F6FF"
        "]+"
    )

    emojis = emoji_pattern.findall(clean)

    if emojis:
        issues.append({
            "type": "emoji",
            "found": emojis
        })

    return issues


# ================= MAIN FUNCTION =================
def analyze_text_quality(full_text: str):
    """
    Runs full text quality analysis:
    - Grammar validation
    - Professional tone checks
    """

    clean = clean_text(full_text)

    grammar_errors = check_grammar_api(clean)
    unprofessional_issues = check_unprofessional(clean)

    total_issues = len(grammar_errors) + len(unprofessional_issues)

    return {
        "total_issues": total_issues,
        "grammar_errors": grammar_errors,
        "unprofessional_issues": unprofessional_issues
    }