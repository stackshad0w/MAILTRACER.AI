import { AttackGraphData } from "./types";

export interface GraphGenerationInput {
  emailId: string;
  subject: string;
  fromAddress: string;
  fromDomain: string;
  ip?: string;
  asn?: string;
  country?: string;
  urls: string[];
  attachments: { filename: string; sha256: string; isMalicious: boolean }[];
  threatDna?: string;
  campaign?: string;
  isMalicious?: boolean;
}

/**
 * Builds the interactive Attack Graph node & edge schema for Cytoscape.js
 */
export function buildAttackGraph(input: GraphGenerationInput): AttackGraphData {
  const nodes: AttackGraphData["nodes"] = [];
  const edges: AttackGraphData["edges"] = [];

  const emailNodeId = `node-email-${input.emailId.substring(0, 8)}`;
  nodes.push({
    id: emailNodeId,
    label: input.subject.length > 25 ? `${input.subject.substring(0, 25)}...` : input.subject,
    type: "EMAIL",
    threatLevel: input.isMalicious ? "DANGER" : "INFO",
    details: { subject: input.subject, sender: input.fromAddress },
  });

  // Sender Node
  const senderId = `node-sender-${input.fromAddress.replace(/[^a-zA-Z0-9]/g, "_")}`;
  nodes.push({
    id: senderId,
    label: input.fromAddress,
    type: "SENDER",
    threatLevel: input.isMalicious ? "WARNING" : "SAFE",
  });
  edges.push({ source: emailNodeId, target: senderId, label: "SENT_FROM" });

  // Domain Node
  const domainId = `node-domain-${input.fromDomain.replace(/[^a-zA-Z0-9]/g, "_")}`;
  nodes.push({
    id: domainId,
    label: input.fromDomain,
    type: "DOMAIN",
    threatLevel: input.isMalicious ? "WARNING" : "INFO",
  });
  edges.push({ source: senderId, target: domainId, label: "DOMAIN_ORIGIN" });

  // IP Node
  if (input.ip) {
    const ipId = `node-ip-${input.ip.replace(/[^a-zA-Z0-9]/g, "_")}`;
    nodes.push({
      id: ipId,
      label: input.ip,
      type: "IP",
      threatLevel: input.isMalicious ? "DANGER" : "INFO",
    });
    edges.push({ source: domainId, target: ipId, label: "RESOLVES_TO" });

    // ASN Node
    if (input.asn) {
      const asnId = `node-asn-${input.asn.replace(/[^a-zA-Z0-9]/g, "_")}`;
      nodes.push({
        id: asnId,
        label: input.asn,
        type: "ASN",
        threatLevel: "INFO",
      });
      edges.push({ source: ipId, target: asnId, label: "ROUTED_BY" });
    }

    // Country Node
    if (input.country) {
      const countryId = `node-country-${input.country.replace(/[^a-zA-Z0-9]/g, "_")}`;
      nodes.push({
        id: countryId,
        label: input.country,
        type: "COUNTRY",
        threatLevel: "INFO",
      });
      edges.push({ source: ipId, target: countryId, label: "GEOLOCATED_IN" });
    }
  }

  // URL Nodes
  input.urls.slice(0, 4).forEach((u, idx) => {
    let urlDomain = "link";
    try {
      urlDomain = new URL(u).hostname;
    } catch {}
    const urlId = `node-url-${idx}-${urlDomain.replace(/[^a-zA-Z0-9]/g, "_")}`;
    nodes.push({
      id: urlId,
      label: urlDomain,
      type: "URL",
      threatLevel: input.isMalicious ? "DANGER" : "WARNING",
      details: { fullUrl: u },
    });
    edges.push({ source: emailNodeId, target: urlId, label: "EMBEDS_LINK" });
  });

  // Attachment Nodes & Hashes
  input.attachments.forEach((att, idx) => {
    const attId = `node-att-${idx}-${att.filename.replace(/[^a-zA-Z0-9]/g, "_")}`;
    nodes.push({
      id: attId,
      label: att.filename,
      type: "ATTACHMENT",
      threatLevel: att.isMalicious ? "DANGER" : "INFO",
    });
    edges.push({ source: emailNodeId, target: attId, label: "ATTACHMENT" });

    const hashId = `node-hash-${att.sha256.substring(0, 10)}`;
    nodes.push({
      id: hashId,
      label: `${att.sha256.substring(0, 8)}...`,
      type: "HASH",
      threatLevel: att.isMalicious ? "DANGER" : "INFO",
      details: { sha256: att.sha256 },
    });
    edges.push({ source: attId, target: hashId, label: "SHA256_HASH" });
  });

  // Threat DNA Node
  if (input.threatDna) {
    const dnaId = `node-dna-${input.threatDna.replace(/[^a-zA-Z0-9]/g, "_")}`;
    nodes.push({
      id: dnaId,
      label: input.threatDna,
      type: "DNA",
      threatLevel: input.isMalicious ? "DANGER" : "INFO",
    });
    edges.push({ source: emailNodeId, target: dnaId, label: "FINGERPRINT_DNA" });

    // Campaign Node
    if (input.campaign) {
      const campId = `node-camp-${input.campaign.replace(/[^a-zA-Z0-9]/g, "_")}`;
      nodes.push({
        id: campId,
        label: input.campaign,
        type: "CAMPAIGN",
        threatLevel: "DANGER",
      });
      edges.push({ source: dnaId, target: campId, label: "MEMBER_OF_CAMPAIGN" });
    }
  }

  return { nodes, edges };
}
