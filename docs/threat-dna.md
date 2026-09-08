# Threat DNA & Campaign Correlation

## Threat DNA Algorithm (`MT-DNA-XXXXXXXX`)
Threat DNA is an algorithmic composite fingerprint generated in `lib/threat-dna.ts`:
1. **Header Fingerprint**: Hash of routing hop sequences, authentication statuses, and envelope alignment.
2. **Infrastructure Fingerprint**: Hash of sender MX domains, resolved ASNs, and lookalike domain stems.
3. **Content Fingerprint**: Hash of normalized subject tokens, URL structures, and attachment hashes.

```text
Header Fingerprint (16 hex)
           +
Infra Fingerprint (16 hex)   → SHA256 → MT-DNA-XXXXXXXX
           +
Content Fingerprint (16 hex)
```

## Campaign Clustering
When an ingested case produces matching Threat DNA or identical infrastructure ASNs, the system automatically correlates the case to an active Threat Campaign cluster (e.g. `Operation Credential Harvest 365`, `AgentTesla Distribution Cluster`).
