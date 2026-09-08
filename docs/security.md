# MailTracer.ai Security Standards & Controls

## 1. SSRF Mitigation Matrix (Section 44)
- Localhost blocking: `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`
- RFC 1918 private subnets: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
- Cloud metadata endpoints: `169.254.169.254`
- Protocol lockdown: Strictly permits only `http://` and `https://`
- DNS Pre-Resolution: IP address verified prior to establishing outbound TCP/TLS connections

## 2. Injection Defenses
- SQL Injection: Fully mitigated via Prisma ORM parameterized queries
- Cross-Site Scripting (XSS): Sanitized React JSX rendering
- Prompt Injection: LLM inputs strictly delimited within inert `<untrusted_evidence_quarantine>` tags

## 3. Safe Payload Execution Policy (Section 77)
MailTracer.ai is a defensive forensic platform. It **NEVER**:
- Executes unvetted binary attachments or macros
- Performs vulnerability exploitation or denial of service
- Brute-forces external authentication forms
