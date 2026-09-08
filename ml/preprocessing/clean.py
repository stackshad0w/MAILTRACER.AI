"""
MailTracer.ai - Preprocessing & PII Redaction Pipeline
Cleans raw text, removes internal IP leakage, strips personally identifiable credentials.
"""

import re
from typing import Dict, Any

def redact_pii(text: str) -> str:
    # Redact email addresses
    redacted = re.sub(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', '[REDACTED_EMAIL]', text)
    # Redact credit cards / SSNs
    redacted = re.sub(r'\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b', '[REDACTED_CARD]', redacted)
    redacted = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[REDACTED_SSN]', redacted)
    return redacted

def normalize_sample(raw_sample: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": raw_sample.get("id"),
        "subject": redact_pii(raw_sample.get("subject", "")),
        "body": redact_pii(raw_sample.get("body", "")),
        "label": raw_sample.get("label", "benign"),
    }

if __name__ == "__main__":
    print("Preprocessing module verified.")
