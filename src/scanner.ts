import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { satisfies } from "semver";
import { allRules } from "./registry";
import type { Issue, ScanResult, Severity } from "./registry/types";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  overrides?: Record<string, string>;
  resolutions?: Record<string, string>;
  pnpm?: { overrides?: Record<string, string> };
}

/**
 * Extract the version number from a dependency specifier.
 * Handles: "^1.2.3", "~1.2.3", "1.2.3", ">=1.0.0", "npm:other@^1.0.0"
 */
function extractVersion(specifier: string): string | null {
  // npm: alias (already overridden, skip)
  if (specifier.startsWith("npm:")) return null;
  // github/git references
  if (specifier.includes("/") || specifier.startsWith("git")) return null;
  // Strip range operators and extract semver
  const match = specifier.match(/(\d+\.\d+\.\d+(?:-[\w.]+)?)/);
  return match ? match[1] : null;
}

/**
 * Check if a package name matches a rule pattern.
 * Supports exact match and prefix wildcard (e.g., "@project-serum/*")
 */
function matchesPackage(depName: string, rulePattern: string): boolean {
  if (rulePattern.endsWith("/*")) {
    const prefix = rulePattern.slice(0, -2);
    return depName.startsWith(prefix + "/");
  }
  return depName === rulePattern;
}

/**
 * Check if a package is already overridden in package.json
 */
function isOverridden(pkg: PackageJson, depName: string): boolean {
  if (pkg.overrides?.[depName]) return true;
  if (pkg.resolutions?.[depName]) return true;
  if (pkg.pnpm?.overrides?.[depName]) return true;
  return false;
}

export function scan(targetDir: string): ScanResult {
  const pkgPath = join(targetDir, "package.json");

  if (!existsSync(pkgPath)) {
    throw new Error(`No package.json found in ${targetDir}`);
  }

  const pkgRaw = readFileSync(pkgPath, "utf8");
  const pkg: PackageJson = JSON.parse(pkgRaw);

  const directDeps = pkg.dependencies ?? {};
  const devDeps = pkg.devDependencies ?? {};

  const allDeps: Array<{ name: string; specifier: string; direct: boolean }> = [];

  for (const [name, specifier] of Object.entries(directDeps)) {
    allDeps.push({ name, specifier, direct: true });
  }
  for (const [name, specifier] of Object.entries(devDeps)) {
    allDeps.push({ name, specifier, direct: true });
  }

  // Also scan lock file for transitive dependencies
  const lockDeps = readLockFile(targetDir);
  for (const [name, version] of lockDeps) {
    if (!allDeps.some((d) => d.name === name)) {
      allDeps.push({ name, specifier: version, direct: false });
    }
  }

  const issues: Issue[] = [];

  for (const dep of allDeps) {
    // Skip if already overridden
    if (isOverridden(pkg, dep.name)) continue;

    const version = extractVersion(dep.specifier);

    for (const rule of allRules) {
      if (!matchesPackage(dep.name, rule.package)) continue;

      // If rule applies to all versions, always match
      if (rule.versions === "*") {
        issues.push({
          severity: rule.severity,
          package: dep.name,
          version: dep.specifier,
          title: rule.title,
          detail: rule.detail,
          fix: rule.fix,
          cve: rule.cve,
          url: rule.url,
          direct: dep.direct,
        });
        continue;
      }

      // Check semver match
      if (version && satisfies(version, rule.versions)) {
        issues.push({
          severity: rule.severity,
          package: dep.name,
          version: version,
          title: rule.title,
          detail: rule.detail,
          fix: rule.fix,
          cve: rule.cve,
          url: rule.url,
          direct: dep.direct,
        });
      }
    }
  }

  // Sort by severity: critical > high > moderate > info
  const severityOrder: Record<Severity, number> = {
    critical: 0,
    high: 1,
    moderate: 2,
    info: 3,
  };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const summary: Record<Severity, number> = { critical: 0, high: 0, moderate: 0, info: 0 };
  for (const issue of issues) {
    summary[issue.severity]++;
  }

  return {
    version: "0.1.0",
    issues,
    summary,
    totalDeps: allDeps.length,
    directDeps: Object.keys(directDeps).length + Object.keys(devDeps).length,
  };
}

/**
 * Read transitive dependencies from lock file (best-effort).
 * Returns [packageName, version] pairs.
 */
function readLockFile(targetDir: string): Array<[string, string]> {
  const deps: Array<[string, string]> = [];

  // Try package-lock.json (npm)
  const npmLockPath = join(targetDir, "package-lock.json");
  if (existsSync(npmLockPath)) {
    try {
      const lock = JSON.parse(readFileSync(npmLockPath, "utf8"));
      const packages = lock.packages ?? {};
      for (const [key, value] of Object.entries(packages)) {
        if (!key || key === "") continue; // root package
        const name = key.replace(/^node_modules\//, "");
        const version = (value as any).version;
        if (name && version) {
          deps.push([name, version]);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  return deps;
}
