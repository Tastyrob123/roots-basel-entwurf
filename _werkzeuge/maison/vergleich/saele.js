#!/usr/bin/env node
/* Ergänzung zu _Werkzeuge/vergleich/vergleich.py für «Kontrollpanel»: Chrome --screenshot springt nicht zu einem Saal (#bureau …) und lieferte
   bei Vorlage und roots nur leere Tapete. Dieses Skript nimmt die Ansichten mit «#» in ansichten.txt neu auf: Seite laden, Saal an den oberen Rand,
   alles einmal auftreten lassen, dann 1440 × 900 und 390 × 844. Es überschreibt nur die Bilder dieser Ansichten in vergleich/bilder/.
   Eigenes Profil (/tmp/roots-maison-vergleich-chrome), eine Instanz, nichts wird geschrieben.   node vergleich/saele.js   (nach vergleich.py) */
const path = require('path'), fs = require('fs');
const pw = require('/Users/robertreff/Desktop/Website-Projekte/_Befund-Vorschlaege/node_modules/playwright');
const HIER = __dirname;
const zeilen = fs.readFileSync(path.join(HIER, 'ansichten.txt'), 'utf8').split('\n').filter(z => z.trim() && !z.trim().startsWith('#'))
  .map(z => z.split('|').map(t => t.trim())).filter(z => z.length === 3 && z[1].includes('#'));
(async () => {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const ctx = await pw.chromium.launchPersistentContext('/tmp/roots-maison-vergleich-chrome', { headless: true, viewport: { width: w, height: h }, deviceScaleFactor: 1, locale: 'de-CH' });
    await ctx.addInitScript(() => { try { for (const k of ['rundgang-sb-maison', 'rundgang-roots-maison']) localStorage.setItem(k, '1'); } catch (e) {} });
    for (const [name, alt, neu] of zeilen) {
      for (const [art, url] of [['vorlage', alt], ['neu', neu]]) {
        const p = await ctx.newPage();
        const [ohne, ziel] = url.split('#');
        await p.goto(ohne, { waitUntil: 'networkidle', timeout: 60000 });
        await p.evaluate(async () => { document.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
          for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 70)); } });
        await p.waitForTimeout(800);
        await p.evaluate(id => { const s = document.getElementById(id); if (s) scrollTo(0, s.getBoundingClientRect().top + scrollY); document.querySelector('.m-oben')?.classList.remove('weg'); }, ziel);
        await p.waitForTimeout(1600);
        await p.screenshot({ path: path.join(HIER, 'bilder', `${name}-${art}-${w}.png`) });
        await p.close();
      }
    }
    await ctx.close();
  }
  console.log(zeilen.length + ' Säle neu aufgenommen (1440 und 390).');
})().catch(e => { console.error(String(e)); process.exit(1); });
