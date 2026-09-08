# Digital Forensic Investigation Workflow

## Investigation Phases
1. **Ingestion & Evidence Custody**:
   - Ingest raw RFC5322 EML message via drag-and-drop or raw paste.
   - Preserves SHA256, SHA1, and MD5 hashes in the Evidence Vault.
2. **Deterministic Authentication Verification**:
   - Parses `Received` header relay hops.
   - Evaluates SPF TXT records via DNS.
   - Validates DKIM cryptographic signatures and selectors.
   - Evaluates DMARC RFC 7489 identifier alignment.
3. **Domain & Network Telemetry**:
   - Interrogates MX, A, and TXT DNS records.
   - Detects homoglyphs, typosquatting, and brand impersonation.
   - Resolves IP reverse DNS (PTR) and autonomous system (ASN).
4. **Defensive Website Verification**:
   - Executes safe HTTP fetch under strict SSRF controls.
   - Inspects TLS certificates and HTTP security headers.
   - Parses credential harvesting input fields.
5. **Threat Scoring & Attack Story**:
   - Computes deterministic score (0-100), verdict, and confidence.
   - Synthesizes Threat DNA code (`MT-DNA-*`).
   - Generates human-readable 5-point Attack Story narrative.
6. **Copilot Review & Reporting**:
   - Analyst queries grounded Copilot with zero hallucination.
   - Generates court-admissible audit-ready incident reports.
