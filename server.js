const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;

const MIME_TYPES = {
  ".css": "text/css; charset=UTF-8",
  ".html": "text/html; charset=UTF-8",
  ".js": "application/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const server = http.createServer((request, response) => {
  const requestPath = decodeURIComponent((request.url || "/").split("?")[0]);
  const filePath = resolveFilePath(requestPath);

  if (!filePath) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=UTF-8" });
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, file) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=UTF-8" });
      response.end("Not Found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extension] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(file);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Preview server running at http://${HOST}:${PORT}`);
});

function resolveFilePath(requestPath) {
  const localPath = requestPath === "/" ? "/index.html" : requestPath;
  const normalized = path.normalize(localPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const absolutePath = path.join(ROOT, normalized);

  if (!absolutePath.startsWith(ROOT)) {
    return null;
  }

  return absolutePath;
}
