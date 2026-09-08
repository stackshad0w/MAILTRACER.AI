# MailTracer.ai System Architecture

## Overview
MailTracer.ai is an enterprise cyber forensics platform integrating multiple independent verification layers:

```mermaid
graph TD
    A[Suspicious Input: Email / URL / Domain / Hash] --> B[Ingestion & Evidence Vault]
    B --> C[SHA256 / MD5 / SHA1 Preservation]
    B --> D[Parallel Verification Engines]
    
    subgraph Engines [Deterministic Multi-Signal Verification]
        D --> E1[Header Forensics & Received Hops]
        D --> E2[SPF / DKIM / DMARC Verifier]
        D --> E3[SSRF-Guarded Website Scanner]
        D --> E4[Domain DNS & Lookalike Typosquatting]
        D --> E5[IP Intelligence & Geolocation]
        D --> E6[Threat Intel Adapters: VirusTotal / AbuseIPDB]
        D --> E7[Prompt-Isolated AI Intent Engine]
    end

    Engines --> F[Explainable Multi-Signal Threat Engine]
    F --> G[Unified Verdict & Confidence Score]
    F --> H[Threat DNA Engine MT-DNA-*]
    H --> I[Campaign Correlation]
    F --> J[Cytoscape.js Interactive Attack Graph]
    F --> K[Evidence-Grounded Investigator Copilot]
```

## Resilience & Graceful Degradation
- Zero dependence on single AI models or external vendor APIs.
- When external threat intelligence keys are unconfigured, status reports `"Status: Not configured"` cleanly without fake data.
- Built-in deterministic security heuristics ensure complete functionality in air-gapped or zero-API environments.
