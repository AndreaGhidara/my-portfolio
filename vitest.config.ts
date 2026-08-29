import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    // Next.js carica .env in modo automatico a runtime; vitest no. La action
    // sendEmail.ts istanzia il client Resend al momento dell'import e lancia
    // se manca la chiave: qui basta un placeholder, i test coprono solo il
    // percorso di validazione, mai un invio reale.
    env: { RESEND_API_KEY: "re_test_placeholder" },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
