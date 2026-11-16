/* Markenbuch · roots, Basel · Bilder für die Listen «Farben» und «Schriften» (Robert 20.10.2026: «in allen Tools Bilder dazu»).
   Nimmt je Schrift und je Ton, der nur auf der Website belegt ist, einen Ausschnitt der Website des Hauses, so wie er dort steht (nur lesen, unsichtbar,
   ein Browser). Aufruf aus bau.py: node listen_bilder.js <zielordner> <seite.html> …  → listen/<name>.png (danach in bau.py zu WebP) */
const path = require('path');
const { chromium } = require('/Users/robertreff/Desktop/Website-Projekte/_Befund-Vorschlaege/node_modules/playwright');
const [, , ZIEL, ...SEITEN] = process.argv;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  // je Wunsch: erstes sichtbares Element mit dieser Schrift (und, falls genannt, auf hellem Grund), 10 bis 90 Zeichen
  const WUNSCH = [
    ['schrift-t', 'Newsreader Titel', 'titel-hell'], ['schrift-n', 'Newsreader Text', 'klein'], ['schrift-s', 'Instrument', 'lauf'],
    ['farbe-tinte', 'Instrument', 'lauf-hell'], ['farbe-papier', null, 'papier']];
  for (const [name, schrift, art] of WUNSCH) {
    let box = null;
    for (const SEITE of SEITEN) {
    await p.goto('file://' + SEITE, { waitUntil: 'load' });
    await p.evaluate(async () => { document.documentElement.classList.remove('vor'); document.querySelectorAll('img').forEach(i => { i.loading = 'eager'; }); await document.fonts.ready;
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } scrollTo(0, 0); });
    await p.addStyleTag({ content: '*{animation:none!important;transition:none!important}[data-zeilen] *,[data-a],[data-r]{opacity:1!important;transform:none!important;clip-path:none!important}html.vor body{visibility:visible!important}' });
    await p.waitForTimeout(600);
    box = await p.evaluate(([schrift, art]) => {
      const hell = el => { let e = el; while (e && e !== document.body) { const c = getComputedStyle(e).backgroundColor; const m = c.match(/\d+/g); if (m && +m[3] !== 0 && c !== 'rgba(0, 0, 0, 0)') { return (+m[0] + +m[1] + +m[2]) / 3 > 180; } e = e.parentElement; } return true; };
      let el;
      // Falle Markenbuch Schäfli: nur Elemente, deren Kinder alle dieselbe Schrift tragen
      const rein = e => [...e.querySelectorAll('*')].every(k => getComputedStyle(k).fontFamily === getComputedStyle(e).fontFamily);
      if (art === 'papier') el = [...document.querySelectorAll('section,div,article')].find(e => getComputedStyle(e).backgroundColor === 'rgb(247, 244, 238)' && e.getBoundingClientRect().height > 160 && e.getBoundingClientRect().width > 500);
      else el = [...document.querySelectorAll('h1,h2,h3,p,span,small,a,b,li,div,dt,dd,time')].find(e => {
        const s = getComputedStyle(e), t = (e.textContent || '').trim(), r = e.getBoundingClientRect();
        if (!s.fontFamily.includes(schrift) || !rein(e) || e.children.length > 3 || t.length < (art === 'hand' ? 3 : 10) || t.length > 90 || r.width < 40 || s.visibility === 'hidden' || +s.opacity === 0) return false;
        if (art === 'titel') return /^(H1|H2)$/.test(e.tagName);
        if (art === 'titel-hell') return /^(H2)$/.test(e.tagName) && hell(e) && t.length <= 60;
        if (art === 'lauf' || art === 'lauf-hell') return e.tagName === 'P' && t.length >= 30 && r.width < 760 && (art === 'lauf' || hell(e)) && !e.closest('nav,header');
        if (art === 'klein') return /^(TIME|DT|DD|P|SPAN)$/.test(e.tagName) && e.children.length === 0 && r.height < 44 && r.width > 120 && hell(e) && !e.closest('svg,[style*=rotate],nav,header,a,button');
        return true;
      });
      if (!el) return null;
      el.scrollIntoView({ block: 'center' });
      const r = el.getBoundingClientRect();
      return art === 'papier' ? { x: 0, y: Math.max(0, r.top), width: Math.min(innerWidth, 1440), height: Math.min(r.height, 520) }
        : { x: Math.max(0, r.left - 24), y: Math.max(0, r.top - 14), width: Math.min(r.width + 48, innerWidth - Math.max(0, r.left - 24)), height: r.height + 28 };
    }, [schrift, art]);
    if (box) break;
    }
    if (!box) { console.log('nicht gefunden', name); continue; }
    await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(ZIEL, name + '.png'), clip: box });
    console.log('ok', name);
  }
  await b.close();
})();
