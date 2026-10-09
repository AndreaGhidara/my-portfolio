import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.{ts,tsx}"],
    // sendEmail.ts crea il client Resend all'import e lancia senza chiave, e
    // vitest non carica .env: basta un segnaposto, nessun test invia davvero.
    env: { RESEND_API_KEY: "re_test_placeholder" },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
