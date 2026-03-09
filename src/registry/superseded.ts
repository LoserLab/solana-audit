import type { Rule } from "./types";

export const supersededRules: Rule[] = [
  {
    package: "@solana/web3.js",
    versions: ">=1.0.0 <2.0.0",
    severity: "moderate",
    title: "Maintenance mode, v2 available",
    detail: "@solana/web3.js v1.x is in maintenance mode. @solana/kit (v2) is the recommended replacement with zero third-party dependencies.",
    fix: "Migrate to @solana/kit. Use npx solana-codemod ./src to automate the migration.",
    url: "https://github.com/anza-xyz/kit",
  },
  {
    package: "@solana/wallet-adapter-base",
    versions: "*",
    severity: "info",
    title: "Superseded by ConnectorKit",
    detail: "The wallet adapter ecosystem has been superseded by ConnectorKit (@solana/connector) with 40-60% fewer re-renders and a simpler API.",
    fix: "Consider migrating to @solana/connector",
    url: "https://www.connectorkit.dev/",
  },
  {
    package: "@solana/wallet-adapter-react",
    versions: "*",
    severity: "info",
    title: "Superseded by ConnectorKit",
    detail: "The wallet adapter ecosystem has been superseded by ConnectorKit (@solana/connector).",
    fix: "Consider migrating to @solana/connector",
    url: "https://www.connectorkit.dev/",
  },
  {
    package: "@solana/wallet-adapter-wallets",
    versions: "*",
    severity: "info",
    title: "Superseded by ConnectorKit",
    detail: "The wallet adapter ecosystem has been superseded by ConnectorKit (@solana/connector).",
    fix: "Consider migrating to @solana/connector",
    url: "https://www.connectorkit.dev/",
  },
  {
    package: "@solana/spl-token",
    versions: "<0.2.0",
    severity: "moderate",
    title: "Outdated class-based API",
    detail: "Versions below 0.2.0 use the old class-based Token API which was removed in later versions.",
    fix: "Upgrade to @solana/spl-token >=0.2.0 or use @solana-program/token with @solana/kit",
  },
];
