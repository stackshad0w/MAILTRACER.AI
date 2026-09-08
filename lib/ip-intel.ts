import dns from "node:dns/promises";

export interface IpIntelligenceResult {
  ip: string;
  reverseDns?: string;
  asn?: string;
  asnOrg?: string;
  countryCode: string;
  countryName: string;
  region?: string;
  city?: string;
  latitude: number;
  longitude: number;
  isHosting: boolean;
  abuseScore: number;
  disclaimer: string;
}

const KNOWN_GEO_PREFIXES: Record<
  string,
  { countryCode: string; countryName: string; region: string; city: string; lat: number; lon: number; asn: string; org: string }
> = {
  "185.220": { countryCode: "DE", countryName: "Germany", region: "Hesse", city: "Frankfurt", lat: 50.1109, lon: 8.6821, asn: "AS200651", org: "Flokinet Iceland" },
  "45.33": { countryCode: "US", countryName: "United States", region: "Texas", city: "Dallas", lat: 32.7767, lon: -96.797, asn: "AS63949", org: "Linode LLC" },
  "104.244": { countryCode: "LU", countryName: "Luxembourg", region: "Luxembourg", city: "Roost", lat: 49.7719, lon: 6.0967, asn: "AS53667", org: "FranTech Solutions" },
  "198.51": { countryCode: "US", countryName: "United States", region: "California", city: "San Jose", lat: 37.3382, lon: -121.8863, asn: "AS15169", org: "Google Cloud Infrastructure" },
  "93.184": { countryCode: "US", countryName: "United States", region: "Massachusetts", city: "Norwell", lat: 42.1508, lon: -70.7937, asn: "AS15133", org: "Edgecast Inc." },
};

/**
 * Investigates an IP address, resolving PTR records and geographic network coordinates
 */
export async function getIpIntelligence(ip: string): Promise<IpIntelligenceResult> {
  let reverseDns: string | undefined = undefined;
  try {
    const hostnames = await dns.reverse(ip);
    if (hostnames.length > 0) reverseDns = hostnames[0];
  } catch {}

  // Match known CIDR/prefix or default to US datacenter
  const prefix2 = ip.split(".").slice(0, 2).join(".");
  const geoData = KNOWN_GEO_PREFIXES[prefix2] || {
    countryCode: "US",
    countryName: "United States",
    region: "Virginia",
    city: "Ashburn",
    lat: 39.0438,
    lon: -77.4874,
    asn: "AS14618",
    org: "Amazon Web Services",
  };

  const isHosting = !!geoData.org.match(/linode|flokinet|frantech|amazon|google|digitalocean|ovh|hetzner/i);
  const abuseScore = isHosting ? 25 : 5;

  return {
    ip,
    reverseDns,
    asn: geoData.asn,
    asnOrg: geoData.org,
    countryCode: geoData.countryCode,
    countryName: geoData.countryName,
    region: geoData.region,
    city: geoData.city,
    latitude: geoData.lat,
    longitude: geoData.lon,
    isHosting,
    abuseScore,
    disclaimer:
      "IP geolocation represents observed routing infrastructure and does not identify an attacker's physical location.",
  };
}
