import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const WEIXIN_PROXY_TARGET = process.env.WEIXIN_PROXY_TARGET || "http://localhost:8080";

  // Proxy weixin API requests through the same origin to avoid browser CORB/CORS issues in dev.
  app.use("/api/weixin", async (req, res) => {
    const targetUrl = `${WEIXIN_PROXY_TARGET}${req.originalUrl}`;
    try {
      const headers = new Headers();
      Object.entries(req.headers).forEach(([key, value]) => {
        if (key.toLowerCase() === "host" || value === undefined) return;
        headers.set(key, Array.isArray(value) ? value.join(",") : value);
      });

      const method = req.method.toUpperCase();
      const hasBody = method !== "GET" && method !== "HEAD";
      let body: Buffer | undefined;
      if (hasBody) {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        if (chunks.length > 0) {
          body = Buffer.concat(chunks);
        }
      }

      const upstream = await fetch(targetUrl, {
        method,
        headers,
        body,
        redirect: "manual",
      });

      res.status(upstream.status);
      upstream.headers.forEach((value, key) => {
        const lower = key.toLowerCase();
        if (lower === "content-encoding" || lower === "transfer-encoding") return;
        res.setHeader(key, value);
      });

      const arrayBuffer = await upstream.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      console.error("weixin proxy error:", error);
      res.status(502).json({
        success: false,
        code: "BAD_GATEWAY",
        message: "Failed to proxy weixin api request",
        data: null,
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
