// Aufnahmen für die freigestellten Objekte im Fuss «Alles auf einen Blick» (09.11.2026): Feed-Seite, Prüfbericht und Karte «Ein Vorschlag.» am Rechner.
//   WB_PORT=9308 node _werkbank/strom_aufnahmen.js  →  ansichten/Strom/{feed,geprueft,angebot}-rechner.jpg   (geprueft/angebot erst nach dem ersten Bau der Werkbank)
const path = require('path'), fs = require('fs');
const { chromium } = require(path.join(process.env.HOME, 'Desktop/Apps & Tools/Tasty Website Builder/node_modules/playwright'));
const B = 'http://127.0.0.1:' + (process.env.WB_PORT || 9308) + '/', Z = path.join(__dirname, 'ansichten', 'Strom');
(async () => {
  fs.mkdirSync(Z, { recursive: true });
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  for (const [n, u] of [['feed', 'feed/index.html'], ['geprueft', 'werkbank/geprueft/index.html'], ['angebot', 'werkbank/karte.html']]) {
    const p = await ctx.newPage();
    const r = await p.goto(B + u, { waitUntil: 'load' }).catch(() => null);
    if (!r || r.status() !== 200) { console.log('fehlt', u); await p.close(); continue; }
    await p.evaluate(() => document.fonts && document.fonts.ready); await p.waitForTimeout(3500);
    await p.screenshot({ path: path.join(Z, n + '-rechner.jpg'), quality: 88 }); console.log('aufgenommen', n); await p.close();
  }
  await b.close();
})();
