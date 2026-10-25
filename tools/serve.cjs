/* 本機測試用靜態伺服器：node tools/serve.cjs [port]。
 * 僅監聽 127.0.0.1；沒有登入門禁，不是公開部署用伺服器。
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = fs.realpathSync(path.join(__dirname, '..'));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.txt': 'text/plain; charset=utf-8' };
function inside(file) {
  const relative = path.relative(ROOT, file);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}
const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
  }
  let file;
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const parts = pathname.split(/[\\/]/).filter(Boolean);
    if (parts.some(p => p.startsWith('.') || p.includes(':'))) throw Error('private path');
    file = path.resolve(ROOT, ...parts);
    if (!inside(file)) throw Error('outside root');
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    file = fs.realpathSync(file);
    if (!inside(file) || !fs.statSync(file).isFile()) throw Error('not a public file');
  } catch (_) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Not found'); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Content-Length': fs.statSync(file).size });
  if (req.method === 'HEAD') { res.end(); return; }
  const stream = fs.createReadStream(file);
  stream.on('error', () => res.destroy()); stream.pipe(res);
});
if (require.main === module) {
  const port = Number(process.argv[2] || 8081);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('Invalid port');
  server.on('error', e => { console.error(e.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log('PokéSurvivor: http://127.0.0.1:' + port + '/'));
}
module.exports = server;
