import { NextResponse } from "next/server";
import { scanWebsite } from "@/lib/website-scanner";
import { z } from "zod";

const verifyWebsiteSchema = z.object({
  url: z.string().url("Invalid URL format"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { url } = verifyWebsiteSchema.parse(json);

    const scanResult = await scanWebsite(url);
    return NextResponse.json({ success: true, result: scanResult });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid URL", details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Website verification failed", details: error instanceof Error ? error.message : "Internal error" },
      { status: 400 }
    );
  }
}
