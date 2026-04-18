import re
import requests

SEPARATOR = "$n$"


def is_valid_grammar_issue(issue):

    message = issue.get("message", "").lower()
    error_text = issue.get("error_text", "").strip()

    # 🔥 Ignore empty / only spaces
    if not error_text or error_text.strip() == "":
        return False

    # Ignore URLs
    if any(x in error_text.lower() for x in ["http", "www", ".com"]):
        return False

    # Ignore very long text
    if len(error_text) > 50:
        return False

    # Ignore name-like patterns
    if error_text.istitle() and len(error_text.split()) == 1:
        return False

    # Ignore weak messages
    if "possible spelling mistake found" in message:
        return False

    return True


# ---------- GRAMMAR CHECK ----------
def check_grammar_api(text: str):

    # 🔥 REMOVE SEPARATOR + NORMALIZE
    text = text.replace(SEPARATOR, " ")
    text = re.sub(r"\s+", " ", text).strip()

    url = "https://api.languagetool.org/v2/check"

    try:
        response = requests.post(url, data={
            "text": text,
            "language": "en-US"
        })

        matches = response.json().get("matches", [])

        results = []
        seen = set()

        for match in matches:
            error_text = text[match["offset"]: match["offset"] + match["length"]]

            issue = {
                "message": match.get("message"),
                "error_text": error_text,
                "suggestions": [
                    r.get("value") for r in match.get("replacements", [])[:3]
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
        return []


# ---------- UNPROFESSIONAL CHECK ----------
def check_unprofessional(text: str):

    # 🔥 CLEAN TEXT HERE ALSO
    text = text.replace(SEPARATOR, " ")

    issues = []

    emoji_pattern = re.compile("["
        u"\U0001F600-\U0001F64F"
        u"\U0001F300-\U0001F5FF"
        u"\U0001F680-\U0001F6FF"
    "]+"

    )

    emojis = emoji_pattern.findall(text)
    if emojis:
        issues.append({
            "type": "emoji",
            "found": emojis
        })

    return issues


# ---------- MAIN FUNCTION ----------
def analyze_text_quality(full_text: str):

    # 🔥 CLEAN ONCE HERE (BEST PRACTICE)
    clean_text = full_text.replace(SEPARATOR, " ")
    clean_text = re.sub(r"\s+", " ", clean_text).strip()

    grammar_errors = check_grammar_api(clean_text)
    unprofessional_issues = check_unprofessional(clean_text)

    total_issues = len(grammar_errors) + len(unprofessional_issues)

    return {
        "total_issues": total_issues,
        "grammar_errors": grammar_errors,
        "unprofessional_issues": unprofessional_issues
    }