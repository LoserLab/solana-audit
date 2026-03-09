import { describe, it, expect } from "vitest";
import { scan } from "../src/scanner";
import { formatHuman, formatJson } from "../src/reporter";
import { join } from "path";

const fixturesDir = join(__dirname, "fixtures");

describe("reporter", () => {
  describe("formatHuman", () => {
    it("shows clean message for no issues", () => {
      const result = scan(join(fixturesDir, "clean"));
      const output = formatHuman(result, false);
      expect(output).toContain("No issues found");
    });

    it("shows issues with severity labels", () => {
      const result = scan(join(fixturesDir, "vulnerable"));
      const output = formatHuman(result, false);
      expect(output).toContain("CRITICAL");
      expect(output).toContain("bigint-buffer");
      expect(output).toContain("Fix:");
    });

    it("includes issue count summary", () => {
      const result = scan(join(fixturesDir, "vulnerable"));
      const output = formatHuman(result, false);
      expect(output).toContain("issues found");
    });
  });

  describe("formatJson", () => {
    it("outputs valid JSON", () => {
      const result = scan(join(fixturesDir, "vulnerable"));
      const json = formatJson(result);
      const parsed = JSON.parse(json);
      expect(parsed.version).toBe("0.1.0");
      expect(parsed.issues).toBeInstanceOf(Array);
      expect(parsed.summary).toBeDefined();
      expect(parsed.exit_code).toBeGreaterThan(0);
    });

    it("sets exit_code 2 for critical issues", () => {
      const result = scan(join(fixturesDir, "vulnerable"));
      const parsed = JSON.parse(formatJson(result));
      expect(parsed.exit_code).toBe(2);
    });

    it("sets exit_code 0 for clean project", () => {
      const result = scan(join(fixturesDir, "clean"));
      const parsed = JSON.parse(formatJson(result));
      expect(parsed.exit_code).toBe(0);
    });
  });
});
