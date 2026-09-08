import { NextResponse } from "next/server";
import { scanWebsite } from "@/lib/website-scanner";
import { z } from "zod";

const verifyWebsiteSchema = z.object({
  url: z.string().min(3, "URL or domain name is required"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    let { url } = verifyWebsiteSchema.parse(json);
    url = url.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    const scanResult = await scanWebsite(url);

    // Build map coordinates for the hosting server
    const mapCoordinates = [];
    if (scanResult.ipIntelligence) {
      mapCoordinates.push({
        ip: scanResult.ipIntelligence.ip,
        country: scanResult.ipIntelligence.countryName,
        city: scanResult.ipIntelligence.city || scanResult.ipIntelligence.region,
        lat: scanResult.ipIntelligence.latitude,
        lon: scanResult.ipIntelligence.longitude,
        asn: scanResult.ipIntelligence.asn,
        org: scanResult.ipIntelligence.asnOrg,
        type: (scanResult.verdict === "MALICIOUS" || scanResult.verdict === "HIGH_RISK") ? "origin" as const : "destination" as const,
      });
    }

    // Build reasons breakdown
    const reasons: Array<{ reason: string; points: number }> = [];
    if (!scanResult.tls.isTrusted) reasons.push({ reason: "Untrusted / Invalid TLS Peer Certificate", points: 18 });
    if (scanResult.contentAnalysis.brandDetected) {
      reasons.push({ reason: `Lookalike domain targeting brand: ${scanResult.contentAnalysis.brandDetected}`, points: 38 });
    }
    if (scanResult.contentAnalysis.hasPasswordInput) {
      reasons.push({ reason: "Credential harvest password input (type=password) detected", points: 20 });
    }
    if (scanResult.contentAnalysis.hasLoginForm && scanResult.contentAnalysis.brandDetected) {
      reasons.push({ reason: "High-threat credential interception on impersonated domain", points: 28 });
    }
    if (!scanResult.securityHeaders.hasHsts) reasons.push({ reason: "Strict-Transport-Security (HSTS) missing", points: 5 });
    if (!scanResult.securityHeaders.hasCsp) reasons.push({ reason: "Content-Security-Policy (CSP) missing", points: 5 });
    if (scanResult.redirectChain.length > 2) reasons.push({ reason: `Excessive HTTP redirection chain (${scanResult.redirectChain.length} hops)`, points: 10 });
    if (reasons.length === 0) reasons.push({ reason: "Standard public web infrastructure verified", points: 5 });

    return NextResponse.json({
      success: true,
      caseNumber: `MT-WEB-${Date.now().toString().slice(-6)}`,
      result: scanResult,
      verdict: scanResult.verdict,
      threatScore: scanResult.riskScore,
      confidence: scanResult.confidence,
      reasons,
      mapCoordinates,
      geolocation: scanResult.ipIntelligence,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid URL input", details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Website verification failed", details: error instanceof Error ? error.message : "Internal error" },
      { status: 400 }
    );
  }
}

