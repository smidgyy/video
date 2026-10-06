// Dev tool: evaluate an expression inside the film page (after ready). Usage: node scripts/tools/probe.mjs "<js expr>"
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const server = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (!fs.existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.json') ? 'application/json' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
await new Promise((r) => server.listen(0, r));
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, colorScheme: 'dark' });
p.on('console', (m) => console.log('console:', m.text())); p.on('pageerror', (e) => console.log('ERR', e.message));
await p.goto(`http://127.0.0.1:${server.address().port}/film/index.html`);
await p.waitForFunction(() => window.__ready !== undefined);
console.log(await p.evaluate(process.argv[2]));
await b.close(); server.close();
