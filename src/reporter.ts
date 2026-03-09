import type { ScanResult, Severity } from "./registry/types";

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "\x1b[31m", // red
  high: "\x1b[33m",     // yellow
  moderate: "\x1b[36m", // cyan
  info: "\x1b[90m",     // gray
};
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

export function formatHuman(result: ScanResult, useColor = true): string {
  const c = (color: string, text: string) =>
    useColor ? `${color}${text}${RESET}` : text;

  const lines: string[] = [];

  lines.push(`${c(BOLD, "solana-audit")} v${result.version}`);
  lines.push("");
  lines.push(
    `Scanning package.json... Found ${result.totalDeps} dependencies (${result.directDeps} direct, ${result.totalDeps - result.directDeps} transitive)`,
  );
  lines.push("");

  if (result.issues.length === 0) {
    lines.push(c("\x1b[32m", "  No issues found. Your Solana dependencies look clean."));
    lines.push("");
    return lines.join("\n");
  }

  for (const issue of result.issues) {
    const color = SEVERITY_COLORS[issue.severity];
    const label = issue.severity.toUpperCase().padEnd(8);
    const tag = issue.direct ? "" : c(DIM, " (transitive)");

    lines.push(
      `  ${c(color, c(BOLD, label))}  ${c(BOLD, issue.package)}@${issue.version}${tag}`,
    );
    lines.push(`            ${issue.title}${issue.cve ? ` (${issue.cve})` : ""}`);
    lines.push(`            ${c(DIM, "Fix:")} ${issue.fix}`);
    lines.push("");
  }

  const parts: string[] = [];
  if (result.summary.critical > 0)
    parts.push(c(SEVERITY_COLORS.critical, `${result.summary.critical} critical`));
  if (result.summary.high > 0)
    parts.push(c(SEVERITY_COLORS.high, `${result.summary.high} high`));
  if (result.summary.moderate > 0)
    parts.push(c(SEVERITY_COLORS.moderate, `${result.summary.moderate} moderate`));
  if (result.summary.info > 0)
    parts.push(c(SEVERITY_COLORS.info, `${result.summary.info} info`));

  lines.push(`${result.issues.length} issues found (${parts.join(", ")})`);
  lines.push("");

  return lines.join("\n");
}

export function formatJson(result: ScanResult): string {
  return JSON.stringify(
    {
      version: result.version,
      issues: result.issues,
      summary: result.summary,
      exit_code: result.summary.critical > 0 ? 2 : result.issues.length > 0 ? 1 : 0,
    },
    null,
    2,
  );
}
