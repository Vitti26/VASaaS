import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["**/*.integration.test.ts"],
    testTimeout: 15000,
    hookTimeout: 15000,
    fileParallelism: false, // evita condiciones de carrera entre tests que comparten la misma base
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
