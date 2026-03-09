import { describe, it, expect } from "vitest";
import { scan } from "../src/scanner";
import { join } from "path";

const fixturesDir = join(__dirname, "fixtures");

describe("scanner", () => {
  it("reports no issues for clean project", () => {
    const result = scan(join(fixturesDir, "clean"));
    expect(result.issues).toHaveLength(0);
    expect(result.summary.critical).toBe(0);
  });

  it("catches vulnerable dependencies", () => {
    const result = scan(join(fixturesDir, "vulnerable"));
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.summary.critical).toBeGreaterThan(0);

    const bigint = result.issues.find((i) => i.package === "bigint-buffer");
    expect(bigint).toBeDefined();
    expect(bigint!.severity).toBe("critical");
    expect(bigint!.cve).toBe("CVE-2025-3194");
  });

  it("catches deprecated packages", () => {
    const result = scan(join(fixturesDir, "vulnerable"));
    const serum = result.issues.find(
      (i) => i.package === "@project-serum/anchor",
    );
    expect(serum).toBeDefined();
    expect(serum!.severity).toBe("high");
  });

  it("catches superseded packages", () => {
    const result = scan(join(fixturesDir, "vulnerable"));
    const web3 = result.issues.find(
      (i) => i.package === "@solana/web3.js" && i.severity === "moderate",
    );
    // Should not flag supply chain attack for ^1.95.6 since satisfies checks extracted version
    // but should flag maintenance mode
    expect(web3).toBeDefined();
  });

  it("skips overridden packages", () => {
    const result = scan(join(fixturesDir, "mixed"));
    const bigint = result.issues.find((i) => i.package === "bigint-buffer");
    expect(bigint).toBeUndefined();
  });

  it("sorts issues by severity", () => {
    const result = scan(join(fixturesDir, "vulnerable"));
    const severities = result.issues.map((i) => i.severity);
    const criticalIndex = severities.indexOf("critical");
    const infoIndex = severities.lastIndexOf("info");
    if (criticalIndex >= 0 && infoIndex >= 0) {
      expect(criticalIndex).toBeLessThan(infoIndex);
    }
  });

  it("throws for missing package.json", () => {
    expect(() => scan("/nonexistent/path")).toThrow("No package.json found");
  });
});
