#!/usr/bin/env node
/* Bildschirme der Werkzeuge für «Kontrollpanel» · roots (M08, M23): unsichtbar in Chromium mit eigenem Profil (/tmp/roots-maison-chrome),
   1440 × 932 @2x = Bildschirm des Blender-Laptops (Carlton-Europe Interlaken/_werkbank/geraet/laptop.json), nach roh/<werkzeug>.png.
   Ohne feste Zeitzone (Fehlerbuch 21.10.2026: Datum und Gruss vom Gerät). Nur Werkzeuge, deren Adresse (stand_wege.json) mit 200 antwortet.
   Jede Anfrage ausser GET/HEAD wird abgewiesen (nichts wird geschrieben), ebenso jeder KI-Weg. Je Werkzeug genau eine Ansicht.
   node _werkzeuge/maison/schirme.js [werkzeug …]   danach: python3 _werkzeuge/maison/bau.py */
const path = require('path'), fs = require('fs');
const pw = require('/Users/robertreff/Desktop/Website-Projekte/_Befund-Vorschlaege/node_modules/playwright');
const HIER = __dirname;
const REIHE = ['bureau', 'carte', 'imprimerie', 'reception', 'livre', 'registre'];
const SW = JSON.parse(fs.readFileSync(path.join(HIER, 'stand_wege.json'), 'utf8'));
const L = JSON.parse(fs.readFileSync('/Users/robertreff/Desktop/Website-Projekte/Carlton-Europe Interlaken/_werkbank/geraet/laptop.json', 'utf8'));
(async () => {
  const nur = process.argv.slice(2);
  const ctx = await pw.chromium.launchPersistentContext('/tmp/roots-maison-chrome', { headless: true, viewport: { width: L.fenster[0], height: L.fenster[1] }, deviceScaleFactor: 2, locale: 'de-CH' });
  await ctx.addInitScript(() => { try { Object.keys(localStorage).forEach(x => { if (/rundgang/i.test(x)) localStorage.setItem(x, '1'); }); localStorage.setItem('ds-roots-willkommen', '1'); } catch (e) {} });
  await ctx.route('**/*', r => { const q = r.request(); return (['GET', 'HEAD'].includes(q.method()) && !/\/api\/(gast|ki|entwurf\b)/.test(q.url())) ? r.continue() : r.abort(); });
  const aus = [];
  for (const k of REIHE) {
    if (nur.length && !nur.includes(k)) continue;
    const adr = (SW[k] || {}).adresse;
    const page = await ctx.newPage();
    const fehler = [];
    page.on('pageerror', e => fehler.push(String(e).slice(0, 160)));
    let antwort = 0;
    try { const r = await page.goto(adr, { waitUntil: 'load', timeout: 60000 }); antwort = r ? r.status() : 0; } catch (e) { fehler.push('lädt nicht: ' + e.message.split('\n')[0]); }
    if (antwort !== 200) { aus.push({ k, adr, uebersprungen: 'Antwort ' + antwort }); await page.close(); continue; }
    await page.waitForTimeout(2200);
    for (const t of ['Überspringen', 'Schliessen']) await page.getByText(t, { exact: true }).first().click({ timeout: 600 }).catch(() => {});
    for (let n = 0; n < 2; n++) { const d = await page.$('dialog[open], [role="dialog"]:not([hidden])'); if (!d || !(await d.isVisible())) break;
      const zu = await d.$('button[aria-label*="chlie"], button.zu, .x, button:has-text("×")'); if (zu) await zu.click().catch(() => {}); else await page.keyboard.press('Escape'); await page.waitForTimeout(500); }
    await page.evaluate(() => { document.querySelectorAll('.rdg-kegel,.rdg-karte,.rdg-sperre,.rdg-schild').forEach(x => x.remove()); scrollTo(0, 0); });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(HIER, 'roh', k + '.png'), type: 'png' });
    aus.push({ k, adr, aufgenommen: 'roh/' + k + '.png', fehler });
    await page.close();
  }
  await ctx.close();
  console.log(JSON.stringify(aus, null, 1));
})().catch(e => { console.error(String(e)); process.exit(1); });
