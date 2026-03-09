import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { applyFixes } from "../src/fixer";
import { scan } from "../src/scanner";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

const tmpDir = join(__dirname, ".tmp-fixer-test");

function setupFixture(deps: Record<string, string>, lockType?: "npm" | "yarn" | "pnpm") {
  mkdirSync(tmpDir, { recursive: true });
  writeFileSync(
    join(tmpDir, "package.json"),
    JSON.stringify({ name: "test", version: "1.0.0", dependencies: deps }, null, 2),
  );
  if (lockType === "yarn") {
    writeFileSync(join(tmpDir, "yarn.lock"), "");
  } else if (lockType === "pnpm") {
    writeFileSync(join(tmpDir, "pnpm-lock.yaml"), "");
  }
}

describe("fixer", () => {
  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("adds npm overrides for bigint-buffer", () => {
    setupFixture({ "bigint-buffer": "^1.1.5" });
    const result = scan(tmpDir);
    const actions = applyFixes(tmpDir, result.issues);
    expect(actions.some((a) => a.includes("npm override"))).toBe(true);

    const pkg = JSON.parse(readFileSync(join(tmpDir, "package.json"), "utf8"));
    expect(pkg.overrides["bigint-buffer"]).toBe("npm:bigint-buffer-safe@^1.0.0");
  });

  it("adds yarn resolutions for bigint-buffer", () => {
    setupFixture({ "bigint-buffer": "^1.1.5" }, "yarn");
    const result = scan(tmpDir);
    const actions = applyFixes(tmpDir, result.issues);
    expect(actions.some((a) => a.includes("yarn resolution"))).toBe(true);

    const pkg = JSON.parse(readFileSync(join(tmpDir, "package.json"), "utf8"));
    expect(pkg.resolutions["bigint-buffer"]).toBe("npm:bigint-buffer-safe@^1.0.0");
  });

  it("adds pnpm overrides for bigint-buffer", () => {
    setupFixture({ "bigint-buffer": "^1.1.5" }, "pnpm");
    const result = scan(tmpDir);
    const actions = applyFixes(tmpDir, result.issues);
    expect(actions.some((a) => a.includes("pnpm override"))).toBe(true);

    const pkg = JSON.parse(readFileSync(join(tmpDir, "package.json"), "utf8"));
    expect(pkg.pnpm.overrides["bigint-buffer"]).toBe("npm:bigint-buffer-safe@^1.0.0");
  });

  it("returns message when no auto-fixable issues", () => {
    setupFixture({ "@solana/web3.js": "^1.95.8" });
    const result = scan(tmpDir);
    const actions = applyFixes(tmpDir, result.issues);
    expect(actions.some((a) => a.includes("No auto-fixable"))).toBe(true);
  });
});
