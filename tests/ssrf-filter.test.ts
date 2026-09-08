import { describe, it, expect } from "vitest";
import { isPrivateOrReservedIp, validateSafeUrl } from "../lib/ssrf-filter";

describe("SSRF Protection Engine", () => {
  it("should correctly identify private and loopback IPv4 addresses", () => {
    expect(isPrivateOrReservedIp("127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("127.255.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("10.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("10.255.255.255")).toBe(true);
    expect(isPrivateOrReservedIp("172.16.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("172.31.255.255")).toBe(true);
    expect(isPrivateOrReservedIp("192.168.1.1")).toBe(true);
    expect(isPrivateOrReservedIp("169.254.169.254")).toBe(true); // AWS/Cloud metadata
    expect(isPrivateOrReservedIp("0.0.0.0")).toBe(true);
  });

  it("should permit public IP addresses", () => {
    expect(isPrivateOrReservedIp("8.8.8.8")).toBe(false);
    expect(isPrivateOrReservedIp("1.1.1.1")).toBe(false);
    expect(isPrivateOrReservedIp("93.184.216.34")).toBe(false);
  });

  it("should block localhost and private URLs", async () => {
    const localhostCheck = await validateSafeUrl("http://localhost:3000");
    expect(localhostCheck.isValid).toBe(false);

    const loopbackCheck = await validateSafeUrl("http://127.0.0.1/admin");
    expect(loopbackCheck.isValid).toBe(false);

    const metadataCheck = await validateSafeUrl("http://169.254.169.254/latest/meta-data/");
    expect(metadataCheck.isValid).toBe(false);
  });

  it("should reject non-HTTP/HTTPS protocols", async () => {
    const fileCheck = await validateSafeUrl("file:///etc/passwd");
    expect(fileCheck.isValid).toBe(false);

    const ftpCheck = await validateSafeUrl("ftp://evil.com/payload");
    expect(ftpCheck.isValid).toBe(false);
  });
});
