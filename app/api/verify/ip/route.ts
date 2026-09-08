import { NextResponse } from "next/server";
import { getIpIntelligence } from "@/lib/ip-intel";
import { threatIntel } from "@/lib/threat-intel/provider-manager";
import { z } from "zod";

const verifyIpSchema = z.object({
  ip: z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^[a-fA-F0-9:]+$/, "Invalid IP address format"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { ip } = verifyIpSchema.parse(json);

    const geoIntel = await getIpIntelligence(ip);
    const intelResults = await threatIntel.queryIndicator("IP", ip);

    return NextResponse.json({
      success: true,
      intelligence: geoIntel,
      threatIntel: intelResults,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid IP address", details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "IP verification failed", details: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
