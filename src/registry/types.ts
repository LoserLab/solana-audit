export type Severity = "critical" | "high" | "moderate" | "info";

export interface Rule {
  /** npm package name (supports glob with * for scoped packages like @project-serum/*) */
  package: string;
  /** Semver range of affected versions, or "*" for all versions */
  versions: string;
  /** Severity level */
  severity: Severity;
  /** Short title for the issue */
  title: string;
  /** Detailed explanation */
  detail: string;
  /** Suggested fix */
  fix: string;
  /** CVE identifier if applicable */
  cve?: string;
  /** URL for more information */
  url?: string;
}

export interface Issue {
  severity: Severity;
  package: string;
  version: string;
  title: string;
  detail: string;
  fix: string;
  cve?: string;
  url?: string;
  /** Whether this is a direct or transitive dependency */
  direct: boolean;
}

export interface ScanResult {
  version: string;
  issues: Issue[];
  summary: Record<Severity, number>;
  totalDeps: number;
  directDeps: number;
}
