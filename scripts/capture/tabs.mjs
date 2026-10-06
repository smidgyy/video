// Click through each control-room tab on the public example manager and capture viewport + element crops.
import { chromium } from 'playwright';
import fs from 'node:fs';
const out = process.argv[2] || 'capture/site/tabs';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('https://tryvoice.fun/agent/orbit', { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(2000);
const tabs = await page.$$eval('[role=tab], .tabs button, nav button, button', els => els.map(e => e.innerText.trim()).filter(t => t && t.length < 30));
console.log('buttons:', JSON.stringify(tabs));
for (const name of ['Coin overview','Teach Manager','Performance','Memory','Personality','Change Brain','Treasury','X account','Settings','Live activity']) {
  const b = page.getByRole('button', { name, exact: true }).or(page.getByRole('tab', { name, exact: true })).first();
  try { await b.click({ timeout: 4000 }); } catch (e) { console.log('no tab', name); continue; }
  await page.waitForTimeout(1200);
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  await page.screenshot({ path: `${out}/${slug}.png`, fullPage: true });
  fs.writeFileSync(`${out}/${slug}.html`, await page.evaluate(() => document.querySelector('main')?.outerHTML || '')); fs.writeFileSync(`${out}/${slug}.txt`, await page.evaluate(() => document.querySelector('main')?.innerText || document.body.innerText));
  console.log('captured', slug);
}
await browser.close();
