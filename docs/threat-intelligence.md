# Threat Intelligence Architecture

## Provider Adapter Interface
Implemented in `lib/threat-intel/provider-manager.ts`:

```typescript
interface ThreatIntelProvider {
  name: string;
  isConfigured(): boolean;
  lookupIP(ip: string): Promise<IntelLookupResult>;
  lookupDomain(domain: string): Promise<IntelLookupResult>;
  lookupURL(url: string): Promise<IntelLookupResult>;
  lookupHash(hash: string): Promise<IntelLookupResult>;
}
```

## Supported Telemetry Providers
- **VirusTotal**: Multi-engine AV analysis for IPs, domains, and file hashes.
- **AbuseIPDB**: Crowdsourced malicious IP reporting and confidence scoring.
- **IPinfo**: ASN routing and geographic network mapping.

## Transparent Fallbacks
When external keys are not provided, MailTracer.ai honestly displays:
```text
Provider: VirusTotal
Status: Not configured
```
The platform never invents fake threat intelligence or fabricates vendor findings.
