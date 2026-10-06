// Extract real tryvoice.fun components (outerHTML) from the captured pages for reuse in the film.
import { chromium } from 'playwright';
import fs from 'node:fs';
const C = 'capture/site';
const jobs = [
  ['launch-heading', `${C}/launch.html`, '.page-heading'],
  ['launch-progress', `${C}/launch.html`, 'nav.launch-progress'],
  ['launch-step-heading', `${C}/launch.html`, '.launch-step-panel .launch-step-heading'],
  ['launch-preview', `${C}/launch.html`, 'aside.launch-preview'],
  ['brand', `${C}/home.html`, 'header .brand'],
  ['model-grid', `${C}/model-selection.html`, '.model-grid'],
  ['voice-presets', `${C}/tabs/personality.html`, '.voice-presets'],
  ['voice-group-1', `${C}/tabs/personality.html`, 'section.voice-control-group'],
  ['permissions', `${C}/tabs/teach-manager.html`, { text: 'Permissions', tag: 'h2', up: '.panel' }],
  ['modes', `${C}/tabs/settings.html`, { text: 'Human control', tag: 'h2', up: '.panel' }],
  ['limits', `${C}/tabs/settings.html`, { text: 'Spending limits', tag: 'h2', up: '.panel' }],
  ['treasury-stats', `${C}/tabs/treasury.html`, '.stats-grid'],
  ['treasury-fund', `${C}/tabs/treasury.html`, { text: 'Fund the operating balance', tag: 'h2,h3', up: '.panel' }],
  ['treasury-heading', `${C}/tabs/treasury.html`, { text: 'Manager Treasury', tag: 'h1,h2', up: '.panel,section' }],
  ['x-account', `${C}/tabs/x-account.html`, { text: '@orbitonsolana', tag: 'strong,span,h2,h3,p', up: '.panel' , nth: -1}],
  ['memory-accounts', `${C}/tabs/memory.html`, { text: 'Known accounts', tag: 'h2,h3', up: '.panel' }],
  ['command-deck', `${C}/tabs/live-activity.html`, 'section.command-deck'],
  ['workspace-tabs', `${C}/tabs/live-activity.html`, '.workspace-tabs'],
  ['agent-stats', `${C}/tabs/live-activity.html`, '.stats-grid'],
  ['decisions', `${C}/tabs/live-activity.html`, { text: 'Decisions', tag: 'h2', up: '.panel' }],
  ['approval-queue', `${C}/tabs/live-activity.html`, { text: 'Approval queue', tag: 'h2', up: '.panel' }],
  ['voice-is-yours', `${C}/tabs/live-activity.html`, { text: 'The voice is yours.', tag: 'h2,h3', up: '.panel' }],
  ['teach-feedback', `${C}/tabs/teach-manager.html`, { text: 'More like this', tag: 'button,span,strong', up: '.panel' }],
];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const cssHref = 'file://' + process.cwd() + '/assets/vendor/voice-site.css';
const fontHref = 'file://' + process.cwd() + '/assets/fonts/fonts.css';
const cache = {};
for (const [name, file, sel] of jobs) {
  if (!cache[file]) cache[file] = fs.readFileSync(file, 'utf8');
  const body = cache[file].replace(/^[\s\S]*?<body[^>]*>/, '').replace(/<\/body>[\s\S]*$/, '').replace(/<script[\s\S]*?<\/script>/g, '');
  await page.setContent(`<!doctype html><html><head><link rel=stylesheet href="${fontHref}"><link rel=stylesheet href="${cssHref}"></head><body class="antialiased">${body}</body></html>`, { waitUntil: 'load' });
  const html = await page.evaluate((sel) => {
    let el;
    if (typeof sel === 'string') el = document.querySelector(sel);
    else {
      const cands = [...document.querySelectorAll(sel.tag)].filter((e) => e.textContent.trim() === sel.text || e.textContent.includes(sel.text));
      const pick = sel.nth === -1 ? cands[cands.length - 1] : cands[0];
      el = pick && pick.closest(sel.up);
    }
    if (!el) return null;
    el.setAttribute('data-fragment', '1');
    return el.outerHTML;
  }, sel);
  if (!html) { console.log('MISSING', name); continue; }
  fs.writeFileSync(`capture/fragments/${name}.html`, html);
  const box = await page.locator('[data-fragment]').first().boundingBox();
  if (box) await page.locator('[data-fragment]').first().screenshot({ path: `capture/fragments/${name}.png` });
  console.log(name.padEnd(20), String(html.length).padStart(6), box ? `${Math.round(box.width)}x${Math.round(box.height)}` : '');
}
await browser.close();
