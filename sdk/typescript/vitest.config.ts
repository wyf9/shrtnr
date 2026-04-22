import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    // Default `yarn test` runs unit tests only. E2e lives under tests/e2e/
    // and is run explicitly by the harness via `yarn vitest run tests/e2e`,
    // which bypasses this exclude because the path is passed as a CLI arg.
    exclude: ["**/node_modules/**", "**/dist/**", "**/tests/e2e/**"],
  },
});
