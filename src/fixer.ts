import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { Issue } from "./registry/types";

interface FixAction {
  package: string;
  override: string;
}

/** Map of packages to their override values */
const OVERRIDE_MAP: Record<string, string> = {
  "bigint-buffer": "npm:bigint-buffer-safe@^1.0.0",
};

/**
 * Detect the package manager from lock files.
 */
function detectPackageManager(
  targetDir: string,
): "npm" | "yarn" | "pnpm" {
  if (existsSync(join(targetDir, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(targetDir, "yarn.lock"))) return "yarn";
  return "npm";
}

/**
 * Apply fixes to package.json by adding overrides/resolutions.
 * Returns a list of actions taken.
 */
export function applyFixes(
  targetDir: string,
  issues: Issue[],
): string[] {
  const pkgPath = join(targetDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const pm = detectPackageManager(targetDir);
  const actions: string[] = [];

  // Collect fixable issues
  const fixes: FixAction[] = [];
  for (const issue of issues) {
    const override = OVERRIDE_MAP[issue.package];
    if (override) {
      fixes.push({ package: issue.package, override });
    }
  }

  if (fixes.length === 0) {
    return ["No auto-fixable issues found. Manual migration required for remaining issues."];
  }

  // Apply overrides based on package manager
  for (const fix of fixes) {
    switch (pm) {
      case "npm": {
        if (!pkg.overrides) pkg.overrides = {};
        if (!pkg.overrides[fix.package]) {
          pkg.overrides[fix.package] = fix.override;
          actions.push(
            `Added npm override: "${fix.package}": "${fix.override}"`,
          );
        }
        break;
      }
      case "yarn": {
        if (!pkg.resolutions) pkg.resolutions = {};
        if (!pkg.resolutions[fix.package]) {
          pkg.resolutions[fix.package] = fix.override;
          actions.push(
            `Added yarn resolution: "${fix.package}": "${fix.override}"`,
          );
        }
        break;
      }
      case "pnpm": {
        if (!pkg.pnpm) pkg.pnpm = {};
        if (!pkg.pnpm.overrides) pkg.pnpm.overrides = {};
        if (!pkg.pnpm.overrides[fix.package]) {
          pkg.pnpm.overrides[fix.package] = fix.override;
          actions.push(
            `Added pnpm override: "${fix.package}": "${fix.override}"`,
          );
        }
        break;
      }
    }
  }

  if (actions.length > 0) {
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    actions.push("");
    actions.push(
      `Updated ${pkgPath}. Run \`${pm === "pnpm" ? "pnpm" : pm} install\` to apply changes.`,
    );
  }

  return actions;
}
