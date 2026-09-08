# Smart India Hackathon (SIH) & Forensic Demonstration Guide

## Live Demonstration Flow
1. **Verification Hub (`/`)**:
   - Showcase the 6 verification modalities (Email, Website, Domain, IP, File Hash, Sender).
   - Click **"Demo Scenarios"** on the top right to instantly open the modal.
2. **Case 1: Credential Phishing (`/cases/MT-CASE-2026-001`)**:
   - **Score**: 92/100 (MALICIOUS, 96% confidence).
   - Show **Verification Matrix**: DMARC failure, lookalike domain (`microsoft-verify-portal.net`), password form.
   - Show **Attack Story**: 5-point incident breakdown narrative.
3. **Interactive Attack Graph (`/cases/MT-CASE-2026-001` or `/attack-graph`)**:
   - Pan, zoom, and click the `EMAIL` or `SENDER` nodes to open the real-time entity inspector drawer.
4. **Investigator Copilot Dialogue (`/copilot`)**:
   - Ask: *"Why did you assign this threat score?"* -> Copilot responds with itemized evidence citations.
   - Ask: *"Is the sender trustworthy?"* -> Explains SPF/DKIM/DMARC alignment.
5. **SSRF Defensive Scanning**:
   - Try inputting `http://127.0.0.1:8080` or `http://localhost` into the website scanner: verify instantaneous SSRF rejection.
