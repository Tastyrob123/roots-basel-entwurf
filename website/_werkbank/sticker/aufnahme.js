// Sticker als Bild (_werkbank/sticker/roh/sNN.png, daraus sticker/img/sNN.webp) und als Druckbogen A3 (sticker/pdf/…), headless, eigenes Profil.
//   WB_PORT=9308 node _werkbank/sticker/aufnahme.js   (Hausserver der roots-Website, serviert website/)
const path = require('path'), fs = require('fs');
const { chromium } = require('/Users/robertreff/Desktop/Website-Projekte/_Befund-Vorschlaege/node_modules/playwright');
const ROOT = path.join(__dirname, '..', '..'), B = 'http://127.0.0.1:' + (process.env.WB_PORT || 9308) + '/';
const PROFIL = '/tmp/roots-sticker-chrome';
const liste = JSON.parse(fs.readFileSync(path.join(__dirname, 'liste.json'), 'utf8'));
(async () => {
  const b = await chromium.launchPersistentContext(PROFIL, { headless: true, viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
  const p = await b.newPage();
  await p.goto(B + '_werkbank/sticker/satz.html', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  const roh = path.join(__dirname, 'roh'); fs.mkdirSync(roh, { recursive: true });
  for (const [id] of liste) await (await p.$('#' + id + ' svg')).screenshot({ path: path.join(roh, id + '.png'), omitBackground: true });
  // Druckbogen A3: jeder Sticker in seiner Grösse (mm aus der Liste), Schnittlinie in Magenta
  const mm = m => { const z = m.match(/(\d+)(?: × (\d+))?/); return [+z[1], +(z[2] || z[1])]; };
  const satz = fs.readFileSync(path.join(__dirname, 'satz.html'), 'utf8');
  const svgs = {}; for (const m of satz.matchAll(/<div class="st" id="(s\d+)">(<svg[\s\S]*?<\/svg>)<\/div>/g)) svgs[m[1]] = m[2];
  const teile = liste.map(([id, , , m]) => { const [w, h] = mm(m); return `<div class="t" style="width:${w}mm;height:${h}mm">${svgs[id].replace(/width="\d+" height="\d+"/, 'width="100%" height="100%"')}</div>`; }).join('');
  const stil = satz.match(/<style>([\s\S]*?)<\/style>/)[1].replace(/url\(\.\.\/\.\.\//g, 'url(' + B).replace(/url\(fonts\//g, 'url(' + B + '_werkbank/sticker/fonts/');
  const bogen = `<!doctype html><html><head><meta charset="utf-8"><style>${stil}
    @page{size:297mm 420mm;margin:12mm}body{margin:0}.bg{display:flex;flex-wrap:wrap;gap:7mm;align-content:flex-start}.t{outline:.2mm solid #e5007d;outline-offset:1.5mm}.t svg{display:block}</style></head><body><div class="bg">${teile}</div></body></html>`;
  // erst auf den Hausserver, damit die Schriften aus demselben Ursprung kommen (von about:blank sperrt der Browser sie)
  const q = await b.newPage(); await q.goto(B + '_werkbank/sticker/satz.html', { waitUntil: 'load' }); await q.setContent(bogen, { waitUntil: 'load' });
  await q.evaluate(async () => { await Promise.all(['16px Newsreader', '500 16px "Instrument Sans"', '16px "DM Mono"'].map(f => document.fonts.load(f))); await document.fonts.ready; }); await q.waitForTimeout(400);
  fs.mkdirSync(path.join(ROOT, 'sticker', 'pdf'), { recursive: true });
  await q.pdf({ path: path.join(ROOT, 'sticker', 'pdf', 'roots-sticker-druckbogen-a3.pdf'), width: '297mm', height: '420mm', printBackground: true });
  await b.close(); console.log(liste.length, 'Sticker aufgenommen, Druckbogen A3');
})();
