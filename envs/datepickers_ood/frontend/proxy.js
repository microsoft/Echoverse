/**
 * Minimal reverse proxy for the agento SyntheticPlaywrightEnvironment contract.
 *
 * The datepicker backend already serves pre-built React pages, so this proxy
 * simply forwards every request from VITE_PORT to VITE_API_PORT (the backend).
 *
 * Environment variables (set by SyntheticPlaywrightEnvironment):
 *   VITE_PORT     – port this proxy listens on
 *   VITE_API_PORT – backend port to proxy to
 */

const http = require("http");

const PORT = parseInt(process.env.VITE_PORT || "3000", 10);
const API_PORT = parseInt(process.env.VITE_API_PORT || "5400", 10);

const server = http.createServer((clientReq, clientRes) => {
  const options = {
    hostname: "localhost",
    port: API_PORT,
    path: clientReq.url,
    method: clientReq.method,
    headers: clientReq.headers,
  };

  const proxy = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxy.on("error", (err) => {
    console.error(`Proxy error: ${err.message}`);
    if (!clientRes.headersSent) {
      clientRes.writeHead(502);
      clientRes.end("Bad Gateway");
    }
  });

  clientReq.pipe(proxy, { end: true });
});

server.listen(PORT, () => {
  console.log(`Frontend proxy listening on :${PORT} → backend :${API_PORT}`);
});
