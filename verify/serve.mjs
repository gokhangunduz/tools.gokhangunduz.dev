// A static server over a Next.js export, for verify/smoke.sh. It does what the
// production host does with `out/`: `/x` serves `x.html` (or `x/index.html`),
// and anything missing gets `404.html` with a 404. No dependencies.
//
//   node verify/serve.mjs <dir> [port]     (port 0, the default, picks a free one)
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";

const root = resolve(process.argv[2] ?? "out");
const port = Number(process.argv[3] ?? 0);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
};

const isFile = (path) => {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
};

function locate(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, "");
  const base = join(root, clean);
  if (base === root) return isFile(join(root, "index.html")) ? join(root, "index.html") : null;
  if (!base.startsWith(root + sep)) return null;
  for (const candidate of [base, `${base}.html`, join(base, "index.html")]) {
    if (isFile(candidate)) return candidate;
  }
  return null;
}

const server = createServer((request, response) => {
  let file = null;
  try {
    file = locate(new URL(request.url ?? "/", "http://localhost").pathname);
  } catch {
    file = null;
  }
  const status = file ? 200 : 404;
  file ??= join(root, "404.html");
  if (!isFile(file)) {
    response.writeHead(404, { "content-type": "text/plain" }).end("not found");
    return;
  }
  response.writeHead(status, {
    "content-type": TYPES[extname(file)] ?? "application/octet-stream",
    "cache-control": "no-store",
  });
  if (request.method === "HEAD") response.end();
  else createReadStream(file).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  const { port: bound } = server.address();
  console.log(`listening http://127.0.0.1:${bound}`);
});
