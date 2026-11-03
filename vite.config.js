import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const file = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  root: file("./web"),
  base: "./",
  esbuild: { jsx: "automatic" },
  build: {
    outDir: file("./dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: { game: file("./web/index.html"), deploy: file("./web/deploy.html") }
    }
  }
});
