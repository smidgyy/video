// Capture real tryvoice.fun pages: full-page screenshots + DOM/CSS tokens.
import { chromium } from 'playwright';
import fs from 'node:fs';
const out = process.argv[2] || 'capture/site';
const pages = (process.argv[3] || '/,/launch,/dashboard,/model-selection,/treasury,/explore').split(',');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
for (const p of pages) {
  const slug = p === '/' ? 'home' : p.replace(/\//g, '_').replace(/^_/, '');
  try {
    await page.goto('https://tryvoice.fun' + p, { waitUntil: 'networkidle', timeout: 45000 });
  } catch (e) { console.log('nav warn', p, e.message.split('\n')[0]); }
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/${slug}.png`, fullPage: true });
  fs.writeFileSync(`${out}/${slug}.html`, await page.content());
  const info = await page.evaluate(() => {
    const cs = getComputedStyle(document.body);
    const root = getComputedStyle(document.documentElement);
    const vars = {};
    for (const sh of document.styleSheets) { try { for (const r of sh.cssRules) { if (r.selectorText === ':root' || r.selectorText === 'html') { for (const k of r.style) if (k.startsWith('--')) vars[k] = r.style.getPropertyValue(k).trim(); } } } catch {} }
    const fonts = [...document.fonts].map(f => `${f.family} ${f.weight} ${f.style} ${f.status}`);
    const h = document.querySelector('h1');
    return { title: document.title, bodyFont: cs.fontFamily, bodyBg: cs.backgroundColor, color: cs.color, h1: h ? { text: h.innerText, font: getComputedStyle(h).fontFamily, size: getComputedStyle(h).fontSize, weight: getComputedStyle(h).fontWeight, ls: getComputedStyle(h).letterSpacing } : null, vars, fonts, height: document.body.scrollHeight };
  });
  fs.writeFileSync(`${out}/${slug}.json`, JSON.stringify(info, null, 2));
  console.log(slug, info.height, info.title, '|', info.h1 && info.h1.text.replace(/\n/g,' '));
}
await browser.close();
