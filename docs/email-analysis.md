# Email Analysis & Header Forensics

## RFC 5322 Ingestion Pipeline
1. **Unfolding**: Multi-line headers are unfolded according to RFC 5322 Section 2.2.3.
2. **Hop Extraction**: `Received` headers are reversed to form chronological routing hops:
   - Origin IP and HELO/EHLO validation
   - Intermediate relay MTA timestamps
   - Internal vs external network boundaries
3. **Identity Alignment**:
   - Compares visible `From` header domain with `Reply-To` and `Return-Path` (envelope sender).
   - Detects display-name impersonation (e.g. `From: "CEO Name" <attacker@domain.com>`).
4. **Authentication Validation**:
   - Queries SPF TXT records via DNS resolver.
   - Parses DKIM signatures, selectors (`s=`), and signing domains (`d=`).
   - Evaluates DMARC RFC 7489 alignment between From domain and SPF/DKIM domains.
