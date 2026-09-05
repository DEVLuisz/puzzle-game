import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Alvo de deploy: Vercel
  nitro: { preset: "vercel" },
  tanstackStart: {
    server: { entry: "server" },
  },
});
