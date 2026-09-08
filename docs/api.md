# MailTracer.ai REST API Reference

All requests and responses use JSON format. Request bodies are strictly validated using Zod.

## Core Endpoints

### Verification Endpoints
- `POST /api/verify/email`: Full end-to-end email forensics pipeline.
  - Body: `{ rawEmail: string, caseTitle?: string }`
- `POST /api/verify/website`: SSRF-safe website scanner.
  - Body: `{ url: string }`
- `POST /api/verify/domain`: DNS interrogation and lookalike brand detection.
  - Body: `{ domain: string }`
- `POST /api/verify/ip`: IP geolocation, reverse DNS, and abuse records.
  - Body: `{ ip: string }`
- `POST /api/verify/hash`: Threat intel signature lookup for MD5/SHA1/SHA256.
  - Body: `{ hash: string }`
- `POST /api/verify/sender`: Sender domain alignment and spoofing detection.
  - Body: `{ email: string, replyTo?: string }`

### Case & Intelligence Endpoints
- `GET /api/cases`: List filtered cases.
- `GET /api/cases/[id]`: Full case dossier with relational graph and timeline.
- `PATCH /api/cases/[id]`: Analyst feedback and status updates.
- `POST /api/copilot`: Grounded RAG queries against case evidence.
  - Body: `{ caseId: string, question: string }`
- `GET /api/threat-dna`: All synthesized Threat DNA fingerprints.
- `GET /api/campaigns`: Active attack campaigns and clusters.
- `GET /api/reports/[id]`: Export audit-ready incident dossier.
- `GET /api/dashboard`: Global SOC metrics and live feed.
