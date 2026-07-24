/**
 * Minimal proxy for the agento SyntheticPlaywrightEnvironment contract.
 */
const http = require("http");
const PORT = parseInt(process.env.VITE_PORT || "3000", 10);
const API_PORT = parseInt(process.env.VITE_API_PORT || "5500", 10);
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
  proxy.on("error", () => {
    if (!clientRes.headersSent) {
      clientRes.writeHead(502);
      clientRes.end("Bad Gateway");
    }
  });
  clientReq.pipe(proxy, { end: true });
});
server.listen(PORT, () => {
  console.log("Frontend proxy on :" + PORT + " -> backend :" + API_PORT);
});
