export interface CopilotEvidenceContext {
  caseNumber: string;
  verdict: string;
  threatScore: number;
  confidence: number;
  fromAddress: string;
  replyTo?: string;
  subject: string;
  dmarcStatus?: string;
  spfStatus?: string;
  dkimStatus?: string;
  lookalikeBrand?: string;
  urls: { url: string; domain: string; reputation: string }[];
  attachments: { filename: string; sha256: string; isMalicious: boolean }[];
  threatDna?: string;
  campaign?: string;
  reasons: { reason: string; points: number }[];
}

export interface CopilotAnswer {
  content: string;
  evidenceCitations: string[];
}

/**
 * Generates an evidence-grounded response to an investigator query.
 * Strictly avoids hallucination by citing verified records from the case context.
 */
export function answerInvestigatorQuery(
  question: string,
  ctx: CopilotEvidenceContext
): CopilotAnswer {
  const q = question.toLowerCase();
  const citations: string[] = [];

  // Question 1: "Why is this email suspicious / malicious?"
  if (q.includes("why") || q.includes("suspicious") || q.includes("malicious") || q.includes("score")) {
    citations.push(`Case Threat Score: ${ctx.threatScore}/100`);
    if (ctx.dmarcStatus === "FAIL") citations.push("Header Forensics: DMARC Authentication Failure");
    if (ctx.lookalikeBrand) citations.push(`Domain Intelligence: Deceptive Brand Typosquatting (${ctx.lookalikeBrand})`);
    if (ctx.urls.some((u) => u.reputation === "MALICIOUS")) citations.push("Threat Intelligence: Malicious URL embedded");

    const reasonList = ctx.reasons.map((r) => `• ${r.reason} (+${r.points} pts)`).join("\n");
    return {
      content: `MailTracer.ai assigned a threat score of **${ctx.threatScore}/100** (**${ctx.verdict}**) with **${ctx.confidence}% confidence** based on the following deterministic evidence:\n\n${reasonList}\n\nThe strongest negative indicator is ${ctx.dmarcStatus === "FAIL" ? "the complete failure of DMARC authentication alignment" : "the presence of deceptive domain and link infrastructure"}.`,
      evidenceCitations: citations,
    };
  }

  // Question 2: "Is the sender trustworthy?"
  if (q.includes("sender") || q.includes("trust") || q.includes("who sent")) {
    citations.push(`Email From: ${ctx.fromAddress}`);
    if (ctx.replyTo) citations.push(`Email Reply-To: ${ctx.replyTo}`);
    citations.push(`DMARC Status: ${ctx.dmarcStatus || "NONE"}`);

    const hasMismatch = ctx.replyTo && ctx.fromAddress.split("@")[1] !== ctx.replyTo.split("@")[1];
    return {
      content: `Analysis of sender **${ctx.fromAddress}**:\n- **DMARC Authentication**: ${ctx.dmarcStatus === "PASS" ? "PASSED (Aligned)" : "FAILED (Unverified identity)"}\n- **SPF Policy**: ${ctx.spfStatus || "Unknown"}\n- **DKIM Cryptographic Signature**: ${ctx.dkimStatus || "None"}\n- **Reply-To Integrity**: ${hasMismatch ? `⚠️ Diverted to ${ctx.replyTo} (Mismatch detected)` : "Aligned"}\n\n**Verdict on Sender**: ${ctx.dmarcStatus === "PASS" && !hasMismatch ? "Sender identity is verified by domain owner." : "Sender identity is unverified and exhibits spoofing markers."}`,
      evidenceCitations: citations,
    };
  }

  // Question 3: "Are there similar attacks / campaigns / Threat DNA?"
  if (q.includes("similar") || q.includes("campaign") || q.includes("threat dna") || q.includes("actor")) {
    citations.push(`Threat DNA: ${ctx.threatDna || "MT-DNA-PENDING"}`);
    if (ctx.campaign) citations.push(`Correlated Campaign: ${ctx.campaign}`);

    return {
      content: `Investigation into related threat clusters:\n- **Threat DNA**: \`${ctx.threatDna || "Generated on ingestion"}\`\n- **Campaign Correlation**: ${ctx.campaign ? `Associated with **${ctx.campaign}**` : "No identical campaign cluster previously recorded"}\n\nThreat DNA correlates message routing, DNS assets, and structural lure characteristics across historical investigations to group coordinated campaigns.`,
      evidenceCitations: citations,
    };
  }

  // Question 4: "Summarize / Executive Summary"
  if (q.includes("summar") || q.includes("executive") || q.includes("overview")) {
    citations.push(`Case: ${ctx.caseNumber}`);
    citations.push(`Subject: ${ctx.subject}`);
    citations.push(`Verdict: ${ctx.verdict}`);

    return {
      content: `### Executive Forensic Summary (${ctx.caseNumber})\n\n- **Subject**: ${ctx.subject}\n- **Claimed Sender**: ${ctx.fromAddress}\n- **Final Verdict**: **${ctx.verdict}** (Score: ${ctx.threatScore}/100)\n- **Key Vulnerability**: ${ctx.dmarcStatus === "FAIL" ? "Domain spoofing / lack of authentication" : "Social engineering payload delivery"}\n- **Recommended Action**: Quarantine immediately and block associated infrastructure at firewall.`,
      evidenceCitations: citations,
    };
  }

  // Default evidence-grounded fallback
  return {
    content: `Based strictly on the preserved evidence for **${ctx.caseNumber}**:\n- Sender: \`${ctx.fromAddress}\`\n- Subject: "${ctx.subject}"\n- Current Threat Score: **${ctx.threatScore}/100** (${ctx.verdict})\n- Threat DNA: \`${ctx.threatDna || "None"}\`\n\nIf you need specific details, ask about sender authenticity, embedded URLs, DMARC status, or campaign correlations.`,
    evidenceCitations: [`Case Record: ${ctx.caseNumber}`],
  };
}
