// Mails des «roots»: der obere Teil jeder Mail als Bild für die Werkbank, doppelte Dichte (Bauart der abgenommenen Vorlage, 09.11.2026).
// WB_PORT=9308 node mails/_src/aufnahme.js   (Hausserver der roots-Website läuft auf 9308; vorher python3 mails/_src/bau.py)  → _werkbank/ansichten/Mails/NN.jpg
// Das Zeichen für die Mails (mails/img/zeichen.png) macht bau.py aus assets/marke/zeichen-hell.png.
// Chromium headless nur mit eigenem Profil unter /tmp/roots-mails-chrome.
const path = require('path'), fs = require('fs');
const { chromium } = require('/Users/robertreff/Desktop/Website-Projekte/_Befund-Vorschlaege/node_modules/playwright');
const ROOT = path.join(__dirname, '..', '..'), B = 'http://127.0.0.1:' + (process.env.WB_PORT || 9308) + '/';
const liste = JSON.parse(fs.readFileSync(path.join(__dirname, 'werkbank.json'), 'utf8'));
(async () => {
  const ctx = await chromium.launchPersistentContext('/tmp/roots-mails-chrome', { headless: true, viewport: { width: 640, height: 900 }, deviceScaleFactor: 2 });
  const ziel = path.join(ROOT, '_werkbank/ansichten/Mails'); fs.mkdirSync(ziel, { recursive: true });
  for (const [nr, ordner] of liste) {
    const p = await ctx.newPage();
    await p.goto(B + 'mails/' + ordner + '/index.html', { waitUntil: 'load' }); await p.waitForTimeout(1200);
    await p.screenshot({ path: path.join(ziel, nr + '.jpg'), quality: 88, clip: { x: 0, y: 0, width: 640, height: 940 }, fullPage: true });
    console.log('Mail', nr, ordner); await p.close();
  }
  await ctx.close();
})();
