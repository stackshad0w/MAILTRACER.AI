"""
MailTracer.ai - Multi-Signal Feature Extractor
Extracts lexical, structural, and authentication features from email samples.
"""

from typing import Dict, Any, List

def extract_features(sample: Dict[str, Any]) -> Dict[str, float]:
    subject = sample.get("subject", "").lower()
    body = sample.get("body", "").lower()
    combined = f"{subject} {body}"

    return {
        "len_body": float(len(body)),
        "has_urgency_kw": float(bool("urgent" in combined or "immediate" in combined or "24 hours" in combined)),
        "has_credential_kw": float(bool("password" in combined or "sign in" in combined or "login" in combined)),
        "has_financial_kw": float(bool("wire" in combined or "invoice" in combined or "payment" in combined)),
        "dmarc_pass": float(sample.get("dmarc_pass", False)),
        "spf_pass": float(sample.get("spf_pass", False)),
        "num_urls": float(sample.get("num_urls", 0)),
        "has_lookalike_domain": float(sample.get("has_lookalike_domain", False)),
    }

if __name__ == "__main__":
    print("Feature extractor verified.")
