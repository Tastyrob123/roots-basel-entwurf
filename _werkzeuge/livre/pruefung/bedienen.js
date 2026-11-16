// Markenbuch · roots, Basel · Bedien-Durchlauf (Master Werkzeug-Bau 9a: bedient, nicht nur geladen), gegen den laufenden Server (Kopie aus der Vorlage).
// Die älteren Läufe funktionen.js und zusatz.js suchen Klassen von vor der Oberfläche «Die Bühne»; dieser Lauf ersetzt sie.
//   NODE_PATH=~/Desktop/Website-Projekte/_Befund-Vorschlaege/node_modules node _werkzeuge/livre/pruefung/bedienen.js chromium|webkit 1440x900|390x844
// Schreibt nur in pruefung/ergebnisse/ (Downloads werden geprüft und wieder gelöscht). Nichts wird gespeichert, nichts geht nach aussen.
const pw = require('playwright'), fs = require('fs'), path = require('path'), os = require('os'), { execSync } = require('child_process');
const BASIS = process.env.BASIS || '/', U = BASIS + '_werkzeuge/livre/';
const motor = process.argv[2] || 'chromium', [W, H] = (process.argv[3] || '1440x900').split('x').map(Number);
const HANDY = W < 700, ERG = path.join(__dirname, 'ergebnisse'); fs.mkdirSync(ERG, { recursive: true });
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'livre-'));
const zeilen = []; let nr = 0;
const L = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'livre.json'), 'utf8')), N = L.fotos.length, ND = L.stand.dateien;
const Z = (was, ok, beleg = '') => { nr++; zeilen.push(`${ok ? 'ok  ' : 'FEHL'} ${String(nr).padStart(2)} ${was}${beleg !== '' ? ' · ' + beleg : ''}`); };
const masse = f => { const o = execSync(`sips -g pixelWidth -g pixelHeight "${f}"`).toString(); return [+o.match(/pixelWidth: (\d+)/)[1], +o.match(/pixelHeight: (\d+)/)[1]]; };

(async () => {
  const br = await pw[motor].launch();
  const ctx = await br.newContext({ viewport: { width: W, height: H }, acceptDownloads: true, reducedMotion: 'reduce',
    ...(HANDY ? { isMobile: motor === 'chromium', hasTouch: true } : {}) });
  await ctx.addInitScript(() => { try { localStorage.setItem('rundgang-sl-livre', '1'); } catch (e) {} });
  const p = await ctx.newPage(); const fehler = [];
  p.on('pageerror', e => fehler.push('JS ' + e.message));
  let abgebrochen = false;   // im Lauf «Netz weg» bricht der Lauf selbst eine Anfrage ab: das zählt nicht als Fehler
  p.on('console', m => { if (m.type() === 'error' && !(abgebrochen && /ERR_FAILED/.test(m.text()))) fehler.push('KONSOLE ' + m.text()); });
  p.on('response', r => { if (r.status() >= 400) fehler.push(r.status() + ' ' + r.url()); });
  const warte = ms => p.waitForTimeout(ms);
  const geh = async u => { await p.goto('about:blank'); await p.goto(u, { waitUntil: 'networkidle' }); await warte(500); };
  const n = s => p.locator(s).count();
  const ueber = async () => p.evaluate(w => document.documentElement.scrollWidth <= w, W);
  const randAuf = async () => { if (HANDY && await n('[data-wo-rand-knopf]')) { await p.locator('[data-wo-rand-knopf]').click(); await warte(400); } };
  const laden = async (loc) => { const [d] = await Promise.all([p.waitForEvent('download'), loc.click()]); const f = path.join(TMP, d.suggestedFilename()); await d.saveAs(f); return [d.suggestedFilename(), f]; };

  // Übersicht
  await geh(U + '#start');
  const t1 = (await p.locator('#ansicht').textContent());
  Z('Übersicht lädt mit Gruss nach Tageszeit', /Guten (Morgen|Tag|Abend)/.test(t1));
  Z(`Zahlen: ${N} Fotos, ${ND} Dateien im Kopf`, new RegExp(`${N} Fotos · ${ND} Dateien`).test(await p.locator('#kopf').textContent()));
  Z('Vier Kacheln Fotos, Logo & Dateien, Markenprüfung, Markenbuch', await n('#ansicht .wo-ag') === 4);
  Z('Kein seitliches Verrutschen (Übersicht)', await ueber());
  const kopfText = await p.locator('#kopf').textContent(), randText = await p.locator('#rand').textContent();
  Z('Zweck-Namen: Markenbuch, Kontrollpanel; keine Namen der Vorlage', /Markenbuch/.test(kopfText) && /Kontrollpanel/.test(randText + await p.locator('#kopf').innerHTML()) && !/Hausbuch|Bildarchiv|Hafenbüro|Die Stube|Werkstatt|Gastgeber|Besucherbuch|Schreibtisch|Schlössli/.test(kopfText + randText + await p.locator('#ansicht').textContent()) && /^Markenbuch · roots/.test(await p.title()), await p.title());
  // Rand
  for (const [k, titel] of [['bilder', 'Fotos'], ['dateien', 'Logo & Dateien'], ['pruefung', 'Markenprüfung'], ['start', 'Übersicht']]) {
    await randAuf();
    await p.locator(`#rand [data-gehe="${k}"]`).click(); await warte(500);
    const zu = HANDY ? !(await p.evaluate(() => document.documentElement.classList.contains('wo-rand-auf'))) : true;
    Z(`Rand → ${titel}: Ansicht und Titel wechseln${HANDY ? ', Menü schliesst' : ''}`, (await p.locator('#kopf .wo-kopf__mitte b').innerText()).includes(titel) && p.url().endsWith('#' + k) && zu);
  }
  // Wege in Kopf, Rand und Leiste antworten
  const wege = await p.evaluate(() => [...document.querySelectorAll('#kopf a[href], #rand a[href], #leiste a[href]')].map(a => a.href).filter(h => !h.endsWith('#')));
  const antw = [];
  for (const h of [...new Set(wege)]) { const r = await p.request.get(h); if (r.status() !== 200) antw.push(r.status() + ' ' + h.replace(BASIS, '/')); }
  Z('Alle Wege in Kopf, Rand und Leiste antworten', antw.length === 0, antw.join(', ') || `${new Set(wege).size} Wege`);
  const [zipName, zipF] = await laden(p.locator('#leiste a[download]'));
  Z('ZIP mit allen Dateien lädt', zipName === 'roots-basel-marke.zip' && fs.statSync(zipF).size > 1e6, `${zipName}, ${(fs.statSync(zipF).size / 1e6).toFixed(1)} MB`);

  // Bildarchiv
  await geh(U + '#bilder');
  Z(`Raster zeigt zuerst ${Math.min(48, N)} Kacheln`, await n('#li-raster .li-f') === Math.min(48, N), await n('#li-raster .li-f'));
  for (let i = 0; i < 6 && await n('#li-raster .li-f') < N; i++) { await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await warte(700); }
  Z(`Nachladen beim Scrollen bis alle ${N} da sind`, await n('#li-raster .li-f') === N, await n('#li-raster .li-f'));
  const kaputt = await p.evaluate(async () => { const im = [...document.querySelectorAll('#li-raster img')]; for (const i of im) { i.loading = 'eager'; } await new Promise(r => setTimeout(r, 2500)); return im.filter(i => !i.complete || !i.naturalWidth).length; });
  Z(`Alle ${N} Vorschaubilder laden`, kaputt === 0, kaputt + ' fehlen');
  await p.evaluate(() => scrollTo(0, 0));
  await p.locator('#li-q').fill('saal'); await warte(500);
  const nq = await n('#li-raster .li-f');
  Z('Suche «saal» filtert, Zähler stimmt', nq > 0 && nq < N && (await p.locator('#li-n').textContent()).startsWith(`${nq} von ${N}`), nq);
  await p.locator('#li-q').fill('<script>alert(1)</script> 🎉 äöü'); await warte(500);
  Z('Suche mit <script>, Emoji, Umlauten: Hinweis statt Kacheln, nichts ausgeführt', await n('#li-raster .li-leer') === 1 && await n('#li-raster script') === 0);
  await p.locator('#li-q').fill('x'.repeat(5000)); await warte(400);
  Z('Suche mit 5000 Zeichen wird auf 200 begrenzt', (await p.locator('#li-q').inputValue()).length === 200);
  await p.locator('#li-reset').click(); await warte(500);
  Z('«Filter zurücksetzen» zeigt wieder alle', (await p.locator('#li-n').textContent()).startsWith(`${N} von ${N}`));
  for (const g of ['b', 's', 'f', 'h']) {
    const knoepfe = await p.locator(`[data-f="${g}"]`).evaluateAll(b => b.map(x => x.dataset.w));
    if (!knoepfe.length) { Z(`Filter ${{ b: 'Bereich', s: 'Saison', f: 'Format', h: 'Herkunft' }[g]}: nur eine Wahl im Haus, darum nicht gezeigt`, !L.fotos.some(f => f[g === 'h' ? 'art' : g] !== L.fotos[0][g === 'h' ? 'art' : g])); continue; }
    const zahlen = [];
    for (const w of knoepfe.filter(w => w !== 'alle')) { await p.locator(`[data-f="${g}"][data-w="${w}"]`).click(); await warte(350); zahlen.push(+(await p.locator('#li-n').textContent()).split(' ')[0]); }
    await p.locator(`[data-f="${g}"][data-w="alle"]`).click(); await warte(350);
    const ok = zahlen.every(x => x > 0 && x <= N) && (await p.locator('#li-n').textContent()).startsWith(`${N} von ${N}`);
    Z(`Filter ${{ b: 'Bereich', s: 'Saison', f: 'Format', h: 'Herkunft' }[g]}: ${zahlen.length} Knöpfe, jeder trifft, «Alle» löst`, ok, zahlen.join('/'));
  }
  // Foto öffnen, vier Grössen, Ausschnitt, Werkstatt
  await p.locator('#li-raster .li-f[data-k="tisch-hoch"]').scrollIntoViewIfNeeded(); await p.locator('#li-raster .li-f[data-k="tisch-hoch"]').click({ force: true });
  await p.waitForSelector('#fenster .li-det'); await warte(600);
  Z('Foto öffnet gross mit Titel, Quelle und Weg zur Quelle', (await p.locator('#fenster h2').innerText()).length > 10 && await n('#fenster .li-meta a.link') === 1);
  Z('Vier Grössen Instagram, Story, Website, Druck', await n('#fenster [data-laden]') === 4);
  const vorher = await p.locator('#fenster [data-laden="instagram"]').getAttribute('href');
  if (!HANDY) {
    await p.locator('#fenster .li-gr[data-g="instagram"]').hover(); await warte(300);
    const r = await p.locator('#li-rahmen').boundingBox();
    Z('Über «Instagram» zeigt den Rahmen im Bild', !!r && r.width > 20);
    const bild = await p.locator('#li-bild').boundingBox();
    await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await p.mouse.down(); await p.mouse.move(r.x + r.width / 2, bild.y + 2, { steps: 8 }); await p.mouse.up(); await warte(300);
    Z('Rahmen ziehen ändert den Ausschnitt im Download- und Werkstatt-Weg', (await p.locator('#fenster [data-laden="instagram"]').getAttribute('href')) !== vorher && /y=0\.0/.test(await p.locator('#fenster [data-imp="instagram"]').getAttribute('href')));
  }
  const FS = L.fotos.find(f => f.k === 'tisch-hoch'), gr = Math.max(FS.w, FS.h) > 2000 ? 2000 / Math.max(FS.w, FS.h) : 1;
  const soll = { instagram: [1080, 1350], story: [1080, 1920], web: [Math.round(FS.w * gr), Math.round(FS.h * gr)], druck: [FS.w, FS.h] };
  for (const g of ['instagram', 'story', 'web', 'druck']) {
    const [name, f] = await laden(p.locator(`#fenster [data-laden="${g}"]`)); const [mw, mh] = masse(f);
    Z(`Download ${g}: ${soll[g].join(' × ')}`, mw === soll[g][0] && mh === soll[g][1] && name.startsWith('roots-basel-tisch-hoch-'), `${name} ${mw}×${mh}`);
  }
  const imps = await p.locator('#fenster [data-imp]').evaluateAll(a => a.map(x => x.getAttribute('href')));
  Z('Zwei Wege in Drucksachen & Feed mit Foto, Haus und Ausschnitt', imps.length === 2 && imps.every(u => u.startsWith('../imprimerie/?haus=roots&foto=tisch-hoch&art=')));
  await p.keyboard.press('Escape'); await warte(300);
  Z('Esc schliesst das Fenster', await p.locator('#fenster').isHidden());
  // roots: nur Fotos des Hauses (keine fremden Rechte, keine KI, nichts nachgeschärft); Fenster schliessen mit Kreuz und daneben
  const oeffne = async k => { await p.locator('#li-q').fill(''); await warte(300);
    const l = p.locator(`#li-raster .li-f[data-k="${k}"]`); for (let i = 0; i < 8 && !(await l.count()); i++) { await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await warte(500); }
    await l.evaluate(el => el.scrollIntoView({ block: 'center' })); await warte(300); await l.click({ force: true }); await p.waitForSelector('#fenster .li-det', { timeout: 8000 }); await warte(500); };
  Z('Nur Fotos des Hauses: keine fremden Rechte, keine KI, keine Kennzeichen', L.fotos.every(f => f.art === 'haus') && await n('#li-raster .li-ki') === 0);
  await oeffne('p-jenny-wein');
  Z('Porträt öffnet mit Fotograf in der Quelle', /Adrian Ehrbar/.test(await p.locator('#fenster').innerText()));
  await p.locator('#fenster [data-zu]').click(); await warte(300);
  Z('Kreuz schliesst das Fenster', await p.locator('#fenster').isHidden());
  await oeffne('teller-oel');
  const [tName, tF] = await laden(p.locator('#fenster [data-laden="druck"]'));
  Z('Teller: Druck aus dem Original in voller Grösse', /^roots-basel-teller-oel-druck-1920x1438\.jpg$/.test(tName) && masse(tF)[0] === 1920, tName);
  await p.mouse.click(5, H - 5); await warte(300);
  Z('Klick neben das Fenster schliesst es', await p.locator('#fenster').isHidden());
  await oeffne('regal');
  Z('Ohne Nachschärfung keine Vorher-Knöpfe', await n('#fenster [data-vn]') === 0);
  await p.keyboard.press('Escape');

  // Dateien
  await geh(U + '#dateien');
  const dl = await p.evaluate(() => [...document.querySelectorAll('#ansicht a[download]')].map(a => a.href));
  const tot = []; for (const h of new Set(dl)) { const r = await p.request.get(h); if (r.status() !== 200 || !(await r.body()).length) tot.push(h); }
  Z('Jede Datei der Ansicht ist abrufbar', tot.length === 0 && dl.length > 30, `${new Set(dl).size} Dateien${tot.length ? ', tot: ' + tot.join(' ') : ''}`);
  Z('Blöcke Zeichen, r und Wurzel, Logo, Name, Tapete, Farben, Schriften, Original, Auszeichnungen', await n('#ansicht .li-d') === 9, await n('#ansicht .li-d'));
  await p.locator('#ansicht .li-farbe').first().click(); await warte(400);
  const fgFotos = await p.locator('#ansicht .li-fg__b img').evaluateAll(a => a.map(x => x.getAttribute('src')));
  Z('Jede Farbgruppe mit einem eigenen Foto (keins doppelt), Farbkarten ohne Foto, jede Schrift mit Bild', fgFotos.length === await n('#ansicht .li-fg') && new Set(fgFotos).size === fgFotos.length && await n('#ansicht .li-farbe img') === 0 && await n('#ansicht .li-schrift') === await n('#ansicht .li-schrift__b img'), `${fgFotos.length} Gruppen`);
  Z('Keine doppelten Fotos im Archiv, keine Raumfotos aus dem Rhypark', new Set(L.fotos.map(f => f.fs)).size === N && L.fotos.filter(f => f.b === 'saal').every(f => !/rhypark/i.test(f.q + f.u)));
  Z('Auszeichnungen nur als Auszeichnungen: unverändert wie die Website, eigener Block', await n('#d-ehre .li-tafel') === 3 && /nicht dem Haus/.test(await p.locator('#d-ehre').innerText()));
  Z('Farbe antippen meldet «Kopiert» mit dem Wert', /Kopiert · #0A2418/.test(await p.locator('#meldung').textContent()));
  const kaputtD = await p.evaluate(async () => { const im = [...document.querySelectorAll('#ansicht img')]; im.forEach(i => i.loading = 'eager'); await new Promise(r => setTimeout(r, 2000)); return im.filter(i => !i.naturalWidth).length; });
  Z('Alle Bilder der Ansicht laden', kaputtD === 0, kaputtD);
  Z('Kein seitliches Verrutschen (Dateien)', await ueber());

  // Markenprüfung
  await geh(U + '#pruefung');
  Z('Unter dem leeren Feld steht schon ein Beispiel', await n('#ansicht .li-erg') >= 1 || /Beispiel/.test(await p.locator('#ansicht').innerText()));
  fs.writeFileSync(path.join(TMP, 'falsch.txt'), 'kein Bild');
  await p.locator('#li-datei').setInputFiles(path.join(TMP, 'falsch.txt')); await warte(500);
  Z('Falscher Dateityp wird abgewiesen', /kein Bild und keine PDF/.test(await p.locator('body').innerText()));
  await p.locator('#li-datei').setInputFiles(path.join(__dirname, '..', 'beispiel', 'entwurf.png')); await warte(600);
  Z('Gewählte Datei: Name und «Prüfen»', /entwurf\.png/.test(await p.locator('#ansicht').innerText()) && await n('#li-los') === 1);
  await p.locator('#li-los').click();
  await p.waitForSelector('#ansicht .li-gesamt', { timeout: 60000 }); await warte(500);
  const txt = await p.locator('#ansicht').innerText();
  Z('Prüfung endet mit Ergebnis: gemessene Farben, KI aus und Probe deutlich beschriftet', /in den Farben des Hauses/.test(txt) && /Probe/.test(txt) && /KI ist ausgeschaltet/.test(txt));
  const [hName] = await laden(p.locator('[data-sichern]'));
  Z('«Ergebnis sichern» legt eine HTML-Datei ab', /^markenbuch-pruefung-.*\.html$/.test(hName), hName);
  await p.locator('[data-kopie-erg]').click(); await warte(300);
  Z('«Als Text kopieren» meldet sich', /Kopiert/.test(await p.locator('#meldung').textContent()));
  await p.locator('[data-neu]').first().click(); await warte(400);
  Z('«Neuen Entwurf prüfen» setzt das Feld zurück', await n('#li-waehle') === 1);
  await p.locator('#li-bsp').click(); await warte(800);
  Z('«Beispiel ansehen»: als Beispiel beschriftet, «passt nicht» zuerst', /eigens gezeichnet/.test(await p.locator('#ansicht').innerText()));
  // Netz weg beim Prüfen
  await geh(U + '#pruefung');
  await p.locator('#li-datei').setInputFiles(path.join(__dirname, '..', 'beispiel', 'entwurf.png')); await warte(400);
  abgebrochen = true; await p.route('**/api/pruefen', r => r.abort());
  await p.locator('#li-los').click(); await warte(1500);
  Z('Netz weg beim Prüfen: Meldung, Datei bleibt gewählt', /Verbindung|antwortet nicht/.test(await p.locator('body').innerText()) && /entwurf\.png/.test(await p.locator('#ansicht').innerText()));
  await p.unroute('**/api/pruefen'); await warte(300); abgebrochen = false;

  // Neuladen bleibt in der Ansicht, Markenbuch
  await geh(U + '#dateien'); await p.reload({ waitUntil: 'networkidle' }); await warte(500);
  Z('Neuladen bleibt in der Ansicht', (await p.locator('#kopf .wo-kopf__mitte b').innerText()).includes('Logo'));
  await geh(U + 'buch.html');
  await p.evaluate(() => { window.__druck = 0; window.print = () => { window.__druck++; }; });
  await p.locator('#bu-pdf').click(); await warte(2500);
  Z('Markenbuch: neun Kapitel, «Als PDF sichern» öffnet den Druck', await n('section.blatt') === 9 && await p.evaluate(() => window.__druck) === 1);
  const kaputtB = await p.evaluate(async () => { const im = [...document.images]; im.forEach(i => i.loading = 'eager'); await new Promise(r => setTimeout(r, 2500)); return im.filter(i => !i.naturalWidth).map(i => i.src); });
  Z('Markenbuch: alle Bilder laden', kaputtB.length === 0, kaputtB.join(' '));
  Z('Kein seitliches Verrutschen (Markenbuch)', await ueber());
  Z('Markenbuch: nichts Internes (Station, Tasty, andere Häuser, verworfene Wahl)', !/Station 05|Tasty Studios|Carlton|Rivage|Ruedihus|Doldenhorn|Schlössli|Bottighofen|Schäfli|verworfene Wahl|Platzhalter|_quelle\/|_kette\/|_qa\/|Späher/.test(await p.locator('body').textContent()));
  await geh(U + 'buch/logo-richtig-falsch/index.html');
  const kaputtL = await p.evaluate(async () => { const im = [...document.images]; im.forEach(i => i.loading = 'eager'); await new Promise(r => setTimeout(r, 1500)); return im.filter(i => !i.naturalWidth).length; });
  Z('Logo richtig und falsch: Seite und Bilder laden, Weg zurück ins Markenbuch', kaputtL === 0 && await n('a[href="../../buch.html#logo"]') >= 1 && await ueber(), kaputtL);
  await geh(U + 'anleitung.html');
  Z('Anleitung: neun Kapitel, Bilder laden', await n('.kap') === 9 && await p.evaluate(async () => { const im = [...document.querySelectorAll('.kap img')]; im.forEach(i => i.loading = 'eager'); await new Promise(r => setTimeout(r, 1500)); return im.length === 9 && im.every(i => i.naturalWidth); }));

  Z('Keine Fehler in der Konsole, keine toten Anfragen', fehler.length === 0, fehler.slice(0, 5).join(' | '));
  await br.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  const kopf = `Markenbuch (marke) · roots · ${motor} ${W} × ${H} · ${new Date().toLocaleString('de-CH')}`;
  const aus = [kopf, ...zeilen, `${zeilen.filter(z => z.startsWith('ok')).length} von ${zeilen.length} ok`].join('\n');
  fs.writeFileSync(path.join(ERG, `bedienen-${motor}-${W}.txt`), aus + '\n'); console.log(aus);
})().catch(e => { console.log(zeilen.slice(-3).join('\n')); console.log('ABBRUCH nach Zeile', nr, e.message.split('\n').slice(0, 3).join(' ')); process.exit(1); });
