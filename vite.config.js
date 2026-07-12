import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT: change "your-journey" below to match your GitHub repo name
// exactly (case-sensitive). GitHub Pages serves your site at
// https://<username>.github.io/<repo-name>/, so Vite needs to know that
// path prefix to load its JS/CSS correctly.
export default defineConfig({
  plugins: [react()],
  base: "/Weight-Journe/",
});
