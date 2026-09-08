# Database Architecture & Models

## Relational Schema (Prisma)
Configured in `prisma/schema.prisma` across 26 models:
- **Core Entities**: `User`, `Case`, `Email`, `EmailHeader`, `AuthenticationResult`
- **Asset Telemetry**: `URL`, `WebsiteScan`, `Domain`, `IPAddress`, `Attachment`, `FileHash`
- **Intelligence & Scoring**: `ThreatIntelResult`, `GeoLocation`, `AIAnalysis`, `ThreatScore`
- **Correlations & Graphs**: `ThreatDNA`, `Campaign`, `CampaignMember`, `GraphNode`, `GraphEdge`
- **Evidence & Governance**: `TimelineEvent`, `Evidence`, `CopilotConversation`, `CopilotMessage`, `Report`, `AuditLog`
- **Model Registry**: `ModelVersion`, `TrainingDataset`

## Database Portability
- **Local Development**: Instant, zero-config SQLite (`dev.db`).
- **Production (Vercel / Cloud)**: Neon / PostgreSQL compatible via standard `DATABASE_URL` environment variable.
