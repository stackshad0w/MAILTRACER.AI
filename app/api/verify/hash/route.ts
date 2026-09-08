import { NextResponse } from "next/server";
import { threatIntel } from "@/lib/threat-intel/provider-manager";
import { z } from "zod";

const verifyHashSchema = z.object({
  hash: z.string().min(32, "Hash must be at least 32 characters (MD5, SHA1, or SHA256)"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { hash } = verifyHashSchema.parse(json);
    const cleanHash = hash.trim().toLowerCase();

    const intelResults = await threatIntel.queryIndicator("HASH", cleanHash);

    const hasMalicious = intelResults.some((r) => r.verdict === "MALICIOUS");
    const hasSuspicious = intelResults.some((r) => r.verdict === "SUSPICIOUS");
    const hasBenign = intelResults.some((r) => r.verdict === "BENIGN");

    let verdict = "UNKNOWN";
    if (hasMalicious) verdict = "KNOWN_MALICIOUS";
    else if (hasSuspicious) verdict = "SUSPICIOUS";
    else if (hasBenign) verdict = "KNOWN_BENIGN";

    return NextResponse.json({
      success: true,
      hash: cleanHash,
      verdict,
      threatIntel: intelResults,
      note: verdict === "UNKNOWN" ? "Unknown hash indicates zero recorded intelligence, not safety." : undefined,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid file hash", details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Hash verification failed", details: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
