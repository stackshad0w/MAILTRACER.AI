# Website Verification & Defensive Scanning

## The Golden Rule of Website Security (Section 17)
> **A website is NOT trusted merely because HTTPS = YES or Certificate = VALID.**
> HTTPS confirms encrypted transport and public CA certificate validity; it does not prove that the website or its operators are legitimate.

## Safe Scanning Architecture
1. **Pre-Flight SSRF Guard**:
   - Hostname resolution validates that target IP does not belong to private networks, loopback, or metadata services.
2. **TLS Handshake Inspection**:
   - Reads peer certificate using Node.js TLS sockets (`issuer`, `subject`, `validTo`, `isTrusted`).
3. **Safe HTTP Fetch**:
   - Follows redirects up to maximum depth.
   - Caps response buffer at 512KB to protect serverless memory allocations.
   - Enforces 7000ms hard timeout.
4. **DOM Credential Harvesting Analysis**:
   - Identifies `<form>` tags targeting authentication endpoints.
   - Scans for `<input type="password">` and sensitive credential fields.
   - Flags lookalike domain brand mismatch (e.g. Microsoft 365 branding hosted on an unauthorized lookalike domain).
