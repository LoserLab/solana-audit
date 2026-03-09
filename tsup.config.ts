import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "bin/solana-audit": "bin/solana-audit.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  shims: true,
});
