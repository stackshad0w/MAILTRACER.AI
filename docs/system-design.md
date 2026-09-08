# MailTracer.ai System Design

## 1. Full-Stack Foundation
- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS v4, custom SOC dark palette with radar sweeps
- **Database & ORM**: Prisma Client with dual SQLite (instant zero-config local) & Neon PostgreSQL compatibility
- **Graph Visualization**: Cytoscape.js directed acyclic graph rendering
- **Testing**: Vitest automated unit and integration suite

## 2. Security Boundaries & Ingestion
- **SSRF Defenses**: Enforced in `lib/ssrf-filter.ts`. Blocks loopback (`127.0.0.1`, `::1`), RFC1918 private ranges, and cloud metadata (`169.254.169.254`).
- **Prompt Injection Quarantine**: Untrusted input enclosed in quarantine delimiters before LLM evaluation.
- **Evidence Immutability**: All original artifacts hashed via SHA256, SHA1, and MD5 upon entry.
