import { defineConfig } from "vite";
import { resolve, normalize } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";

const HERO_DIRS = ["hero1", "hero2", "hero3"];

/**
 * Custom dev middleware: explicitly resolve /heroN (with or without trailing
 * slash) to heroN/index.html so the multi-page entries win over Vite's SPA
 * fallback. Without this, a request to /hero1 falls through to index.html,
 * which renders the CinematicFooter shell and looks like a redirect.
 */
function heroRoutesPlugin() {
  return {
    name: "bchat-hero-routes",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();

        const url = new URL(req.url, "http://localhost");
        const match = url.pathname.match(/^\/(hero[123])(\/)?$/);
        if (!match) return next();

        const file = resolve(process.cwd(), match[1], "index.html");
        if (!existsSync(file)) return next();

        const wantsTrailingSlash = url.pathname.endsWith("/");
        if (!wantsTrailingSlash) {
          // Permanent redirect to the canonical /heroN/ URL.
          const target = `${url.pathname}/${url.search}`;
          res.statusCode = 301;
          res.setHeader("Location", target);
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(`<!doctype html><title>301</title><a href="${target}">${target}</a>`);
          return;
        }

        const html = readFileSync(file, "utf-8");
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(html);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), heroRoutesPlugin()],
  server: { port: 5175 },
  build: {
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        hero1: resolve(__dirname, "hero1/index.html"),
        hero2: resolve(__dirname, "hero2/index.html"),
        hero3: resolve(__dirname, "hero3/index.html"),
      },
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.js"],
  },
});
