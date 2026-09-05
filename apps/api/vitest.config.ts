import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    setupFiles: ["./src/test/setup.ts"],
    // Integration tests share one real Postgres database — running files in
    // parallel would let them stomp on each other's rows, so keep it to one
    // worker. Test files still run in sequence within that worker too.
    fileParallelism: false,
    isolate: false,
    testTimeout: 15000,
    include: ["src/**/*.test.ts"],
  },
});
