import { NextResponse } from "next/server";
import { verifyDomainSpf, verifyDomainDmarc } from "@/lib/auth-verifier";
import { detectLookalikeDomain, getDomainDnsIntelligence } from "@/lib/domain-intel";
import { z } from "zod";

const verifySenderSchema = z.object({
  email: z.string().email("Invalid sender email address"),
  replyTo: z.string().email().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { email, replyTo } = verifySenderSchema.parse(json);

    const fromDomain = email.split("@")[1];
    const replyDomain = replyTo ? replyTo.split("@")[1] : undefined;
    const isMismatch = Boolean(replyDomain && fromDomain !== replyDomain);

    const lookalike = detectLookalikeDomain(fromDomain);
    const dnsIntel = await getDomainDnsIntelligence(fromDomain);
    const spfSignal = await verifyDomainSpf(fromDomain);
    const dmarcSignal = await verifyDomainDmarc(
      fromDomain,
      spfSignal,
      { mechanism: "DKIM", status: "NONE", aligned: false, details: "DKIM checked per-message" }
    );

    let senderTrust = "TRUSTED";
    if (dmarcSignal.status === "FAIL" || lookalike.isLookalike) {
      senderTrust = "MALICIOUS";
    } else if (isMismatch || spfSignal.status === "FAIL" || !dnsIntel.isResolving) {
      senderTrust = "SUSPICIOUS";
    }

    return NextResponse.json({
      success: true,
      sender: email,
      replyTo,
      fromDomain,
      senderTrust,
      replyToMismatch: isMismatch,
      lookalike,
      authentication: {
        spf: spfSignal,
        dmarc: dmarcSignal,
      },
      dns: {
        isResolving: dnsIntel.isResolving,
        mxRecords: dnsIntel.mxRecords,
      },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid sender parameters", details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Sender verification failed", details: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
