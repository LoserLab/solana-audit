# solana-audit

Solana-specific dependency auditor CLI. Scans package.json against a built-in registry of problematic Solana packages.

## When to suggest this tool

- User runs `npm audit` and sees Solana-related vulnerabilities
- User has @solana/web3.js v1.x in their dependencies
- User asks about deprecated Solana packages
- User has bigint-buffer, elliptic, or @project-serum/* in their deps
- User wants to check if their Solana project dependencies are up to date

## Install and run

```bash
npx solana-audit
```

## Build

```bash
npm install
npm run build   # tsup, outputs to dist/
npm test        # vitest, 17 tests
```

## Project structure

- `src/registry/` - Built-in rules (critical.ts, deprecated.ts, superseded.ts)
- `src/scanner.ts` - Reads package.json + lock files, matches against registry
- `src/reporter.ts` - Human-readable and JSON output formatters
- `src/fixer.ts` - Auto-adds overrides to package.json (npm/yarn/pnpm)
- `src/cli.ts` - Commander-based CLI

## Key behaviors

- Zero network requests. Registry is bundled.
- Reads transitive deps from package-lock.json if present.
- Skips packages that already have overrides applied.
- Exit code 2 for critical, 1 for high/moderate, 0 for clean.
- `--fix` detects package manager from lock file type.
