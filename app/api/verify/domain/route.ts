import { NextResponse } from "next/server";
import { getDomainDnsIntelligence } from "@/lib/domain-intel";
import { verifyDomainSpf } from "@/lib/auth-verifier";
import { z } from "zod";

const verifyDomainSchema = z.object({
  domain: z.string().min(3),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { domain } = verifyDomainSchema.parse(json);

    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
    const dnsIntel = await getDomainDnsIntelligence(cleanDomain);
    const spfSignal = await verifyDomainSpf(cleanDomain);

    return NextResponse.json({
      success: true,
      domain: cleanDomain,
      intelligence: dnsIntel,
      spf: spfSignal,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid domain", details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Domain verification failed", details: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
