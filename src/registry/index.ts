import { criticalRules } from "./critical";
import { deprecatedRules } from "./deprecated";
import { supersededRules } from "./superseded";
import type { Rule } from "./types";

export const allRules: Rule[] = [
  ...criticalRules,
  ...deprecatedRules,
  ...supersededRules,
];

export { criticalRules, deprecatedRules, supersededRules };
export type { Rule, Severity, Issue, ScanResult } from "./types";
