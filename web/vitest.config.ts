import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  // Sans ceci, esbuild transpile le tsx en JSX classique (tsconfig.json a
  // "jsx": "preserve" pour Next.js) : les composants appelés directement
  // depuis un fichier de test référenceraient un React global non importé.
  esbuild: {
    jsx: "automatic",
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
