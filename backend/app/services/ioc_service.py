import re


IP_PATTERN = re.compile(
    r"\b(?:"
    r"(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)"
    r"\.){3}"
    r"(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)"
    r"\b"
)

URL_PATTERN = re.compile(
    r"https?://[^\s]+",
    re.IGNORECASE,
)

DOMAIN_PATTERN = re.compile(
    r"\b(?:[a-zA-Z0-9-]+\.)+"
    r"(?:com|net|org|io|dev|xyz|info|biz|co|in|uk|ru|cn|de|fr|me|online)\b",
    re.IGNORECASE,
)


def extract_iocs(command: str):
    """
    Extract potential indicators of compromise from a command.
    """

    iocs = []

    # Extract IP addresses
    for ip in IP_PATTERN.findall(command):
        iocs.append({
            "type": "IP",
            "value": ip,
        })

    # Extract URLs
    for url in URL_PATTERN.findall(command):
        iocs.append({
            "type": "URL",
            "value": url.rstrip(".,;"),
        })

    # Extract domains
    for domain in DOMAIN_PATTERN.findall(command):
        if not IP_PATTERN.fullmatch(domain):
            iocs.append({
                "type": "DOMAIN",
                "value": domain,
            })

    return iocs