import { serve } from "bun";
import index from "./index.html";

const GO_BACKEND = "http://localhost:8080";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,
  },

  fetch(req) {
    const url = new URL(req.url);
    // Proxy /api/* and /fdsnws/* to Go backend in dev mode
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/fdsnws/")) {
      const target = new URL(url.pathname + url.search, GO_BACKEND);
      return fetch(target.toString(), {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
    }
    return new Response("Not Found", { status: 404 });
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Server running at ${server.url}`);
