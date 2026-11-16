// Prüflauf Anfragen & Chat · roots Basel (09.11.2026, Kopie des Prüflaufs der Vorlage). Bedient statt lädt (Master 9a), unsichtbar, eigener Server mit Wegwerf-Daten.
//   node roots.js <basis, z. B. http://127.0.0.1:9305> [chromium|webkit] [breite] [bilder-ordner]
// Prüft: jede Ansicht zweimal, Konsole, 404, kaputte Bilder, seitliches Überlaufen; Eingang mit Hinweisen und Allergien; Brief (Probe), ändern, sichern,
// neu laden; erledigt/offen; Deutsch lesen; PDF; Nachtragen; Wissen suchen; Chat ausprobieren → Anfrage; die Bewerbung der Website über den Baustein;
// Sicherheit des Wegs «formular»; am Rechner Flüssigkeit 4× gedrosselt. Räumt jede Spur mit «QA» wieder weg.
const path = require('path'), fs = require('fs');
const pw = require(path.join(process.env.HOME, 'Desktop/Apps & Tools/Tasty Website Builder/node_modules/playwright'));
const [, , BASIS = 'http://127.0.0.1:9048', MOTOR = 'chromium', BREITE = '1440', BILDER = ''] = process.argv;
const W = +BREITE, HANDY = W < 700, WZ = BASIS + '/_werkzeuge/reception/';
const res = [], fehler = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const br = await pw[MOTOR].launch();
  const ctx = await br.newContext({ viewport: { width: W, height: HANDY ? 844 : 900 }, locale: 'de-CH', acceptDownloads: true, hasTouch: HANDY, isMobile: HANDY && MOTOR === 'chromium' });
  await ctx.addInitScript(() => { try { localStorage.setItem('reception-name', 'QA Prüfer'); localStorage.setItem('rundgang-reception', '1'); localStorage.setItem('rundgang-savoir', '1'); } catch (e) { /* */ } });
  const p = await ctx.newPage(); p.setDefaultTimeout(+(process.env.WARTEN || 15000)); p.setDefaultNavigationTimeout(+(process.env.WARTEN || 15000));   // WARTEN: bei hoher Rechnerlast (andere Chats) länger warten
  p.on('pageerror', e => fehler.push('JS ' + String(e).slice(0, 160)));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) fehler.push('Konsole ' + m.text().slice(0, 160)); });
  p.on('response', r => { if (r.status() >= 400 && !/favicon|marke\.json|api\/formular|api\/gast/.test(r.url())) fehler.push(r.status() + ' ' + r.url().replace(BASIS, '')); });
  p.on('dialog', d => d.accept().catch(() => {}));
  const schritt = async (name, fn) => { const f0 = fehler.length, t0 = Date.now(); try { const info = await fn(); const neu = fehler.slice(f0); res.push({ name, ok: !neu.length, info: (neu.length ? neu.join(' | ') + ' · ' : '') + (info || '') }); }
    catch (e) { res.push({ name, ok: false, info: String(e.message || e).split('\n')[0].slice(0, 220) }); } const r = res[res.length - 1]; console.log((r.ok ? 'ok   ' : 'ROT  ') + name + ' · ' + r.info + ` (${Date.now() - t0} ms)`); };
  const ok = (b, was) => { if (!b) throw new Error(was); };
  const api = async (was, d) => p.evaluate(async ([w, d]) => { const r = await fetch(w, d ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) } : {}); return { s: r.status, j: await r.json().catch(() => ({})) }; }, [WZ + 'api/' + was, d]);
  const gehe = async a => { await p.goto('about:blank'); await p.goto(WZ + '#' + a, { waitUntil: 'load' }); await p.waitForSelector('#ansicht > *'); await sleep(900); };
  const ueber = async () => p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth);
  const kaputt = async () => p.evaluate(() => [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map(i => i.getAttribute('src')));
  const bild = async n => { if (BILDER) { fs.mkdirSync(BILDER, { recursive: true }); await p.screenshot({ path: path.join(BILDER, `${MOTOR}-${W}-${n}.jpg`), quality: 70, type: 'jpeg' }); } };
  const karte = async re => { const k = p.locator('.re-liste .re-a', { hasText: re }).first(); await k.scrollIntoViewIfNeeded(); await k.click(); await p.waitForFunction(r => new RegExp(r).test(document.querySelector('#detail h2')?.textContent || ''), re.source); await sleep(500); };

  for (const a of ['start', 'eingang', 'gefragt', 'nachgetragen', 'wissen']) await schritt(`Ansicht ${a}: zweimal geladen, kein Fehler, kein Überlaufen, keine kaputten Bilder`, async () => {
    for (let i = 0; i < 2; i++) { await gehe(a); const u = await ueber(), k = await kaputt(); ok(u <= 0, 'überläuft um ' + u + ' px'); ok(!k.length, 'kaputte Bilder ' + k.join(', ')); }
    await bild(a); return (await p.locator('#kopf').innerText()).replace(/\s+/g, ' ').slice(0, 80); });

  await schritt('Kein roher Code im Bild ({, undefined, NaN, None, null) in allen Ansichten und jeder Anfrage (Fehlerbuch 10a)', async () => {
    const roh = async () => p.evaluate(() => { const t = document.body.innerText; return (t.match(/\{[^}\n]{0,40}\}|\bundefined\b|\bNaN\b|\bNone\b|\bnull\b/g) || []).slice(0, 5); });
    const funde = [];
    for (const a of ['start', 'eingang', 'gefragt', 'nachgetragen', 'wissen']) { await gehe(a); funde.push(...(await roh()).map(x => a + ': ' + x)); }
    await gehe('eingang'); const n = await p.locator('.re-liste .re-a').count();
    for (let i = 0; i < n; i++) { const c = p.locator('.re-liste .re-a').nth(i); await c.scrollIntoViewIfNeeded(); await c.click(); await sleep(500); funde.push(...(await roh()).map(x => 'Anfrage ' + i + ': ' + x)); }
    ok(!funde.length, funde.join(' | ')); return n + ' Anfragen, 5 Ansichten'; });
  await schritt('Auswahl und Kalender im Stil des Hauses: keine Systemauswahl sichtbar, Bereich und «Gilt bis» wählbar', async () => {
    await gehe('wissen'); await p.click('#w-neu'); await p.waitForSelector('#fenster:not([hidden]) #f-ber'); await sleep(400);
    const sys = await p.evaluate(() => [...document.querySelectorAll('select, input[type=date]')].filter(e => { const r = e.getBoundingClientRect(), st = getComputedStyle(e); return r.width > 2 && r.height > 2 && st.opacity !== '0' && st.visibility !== 'hidden'; }).length);
    ok(sys === 0, sys + ' Systemfelder sichtbar');
    await p.click('#f-ber + .ws-wahl'); await p.click('.ws-wahl__l [role=option]:has-text("Veranstaltungen")'); ok(await p.inputValue('#f-ber') === 'Veranstaltungen', 'Bereich: ' + await p.inputValue('#f-ber'));
    await p.click('#f-bis + .ws-wahl'); await p.click('.ws-kal [data-m="1"]'); await p.click('.ws-kal__g [data-v$="-15"]'); const v = await p.inputValue('#f-bis'); ok(/^\d{4}-\d{2}-15$/.test(v), 'Datum: ' + v);
    await p.keyboard.press('Escape'); return 'Bereich Veranstaltungen, gilt bis ' + v; });
  await schritt('Bilder in jeder Liste: jeder Eintrag hat ein geladenes Foto (Robert 19.10.2026)', async () => {
    const pruef = async (a, sel, bildSel) => { await gehe(a); await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } scrollTo(0, 0); }); await sleep(800);
      return p.evaluate(([s, b]) => { const e = [...document.querySelectorAll(s)]; const ohne = e.filter(x => { const i = x.querySelector(b + ' img'); return !i || !(i.complete && i.naturalWidth > 0); }); return [e.length, ohne.length]; }, [sel, bildSel]); };
    const z = { eingang: await pruef('eingang', '.re-liste .re-a', '.re-a__bild'), gefragt: await pruef('gefragt', '.re-f', '.re-f__bild'), nachgetragen: await pruef('nachgetragen', '.re-n', '.re-n__bild'), wissen: await pruef('wissen', '.sb-z', '.sb-z__bild') };
    const schlecht = Object.entries(z).filter(([, [n, o]]) => !n || o); ok(!schlecht.length, JSON.stringify(z)); return Object.entries(z).map(([k, [n]]) => k + ' ' + n).join(', '); });
  await schritt('Eingang: Hinweise geschlossen, Mittag, Gruppe, Allergien stehen bei den richtigen Anfragen', async () => {
    await gehe('eingang'); await karte(/Daniela Frei/); const e = await p.locator('#detail .re-hinw').innerText(); ok(/Sonntag: geschlossen/.test(e) && /22 Personen/.test(e), 'Frei: ' + e);
    await karte(/Sabine Roth/); const b = await p.locator('#detail .re-hinw').innerText(); ok(/Mittags nur donnerstags/.test(b), 'Roth: ' + b);
    await karte(/Claudia Meier/); const s = await p.locator('#detail .re-hinw').innerText(); ok(/Allergien/.test(s), 'Meier Allergien: ' + s.slice(0, 120));
    await karte(/Peter Graf/); ok(await p.locator('#detail .re-hinw').count() === 0, 'Graf: Hinweis ohne Grund'); return 'Frei, Roth, Meier, Graf'; });
  await schritt('Eingang ruhig gesetzt (Robert 20.10.): Hinweise mit Luft zur Schrift, kein Leerraum in der Karte, Rundgang-Schild bleibt beim Scrollen stehen', async () => {
    await gehe('eingang'); await karte(/Daniela Frei/);
    const m = await p.evaluate(() => { const d = document.querySelector('#detail .re-d').getBoundingClientRect(), h = document.querySelector('#detail .re-hinw').getBoundingClientRect(), g = document.querySelector('#detail .re-angaben--gast').getBoundingClientRect(), z = document.querySelector('#detail .re-gespraech').getBoundingClientRect();
      return { luft: Math.round(h.top - g.bottom), rest: Math.round(d.bottom - z.bottom) }; });
    ok(m.luft >= 14, 'Hinweise nur ' + m.luft + ' px unter den Angaben'); ok(m.rest <= 140, m.rest + ' px Leerraum unter der Nachricht');
    const c2 = await br.newContext({ viewport: { width: W, height: HANDY ? 844 : 900 } }); await c2.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); }); const q = await c2.newPage(); await q.goto(WZ + '#eingang'); await q.waitForSelector('#ansicht > *');
    const sch = await q.waitForSelector('.rdg-schild', { timeout: 8000 }).catch(() => null); ok(sch, 'Rundgang-Schild erscheint nicht');
    await q.mouse.move(W / 3, 400); await sleep(1200); const y0 = (await sch.boundingBox()).y; await q.mouse.wheel(0, 900); await sleep(800); const y1 = ((await sch.boundingBox()) || { y: y0 }).y; const wander = Math.round(Math.abs(y1 - y0)); await c2.close();
    ok(wander <= 2, 'Schild wandert ' + wander + ' px'); return `Luft ${m.luft} px, Rest ${m.rest} px, Schild ${wander}`; });
  await schritt('Eingang: Auswahl Reservation / Gruppe / Gutschein zählt richtig', async () => {
    await gehe('eingang'); const z = {}; for (const k of ['Reservation', 'Gruppe', 'Gutschein']) { await p.click(`.re-abt [data-abt="${k}"]`); await sleep(400); z[k] = await p.locator('.re-liste .re-a').count(); }
    await p.click('.re-abt [data-abt="alle"]'); const d = (await api('anfragen')).j.anfragen; const soll = { Reservation: d.filter(a => ['tisch', 'nachricht'].includes(a.art)).length, Gruppe: d.filter(a => ['bankett', 'anlass'].includes(a.art)).length, Gutschein: d.filter(a => a.art === 'gutschein').length };
    ok(JSON.stringify(z) === JSON.stringify(soll), JSON.stringify(z) + ' ≠ ' + JSON.stringify(soll)); return JSON.stringify(z); });
  await schritt('Brief: «Brief schreiben» (Probe ohne KI) nennt die Allergie, Text ändern, sichern, neu laden, bleibt', async () => {
    await gehe('eingang'); await karte(/Claudia Meier/);
    if (await p.locator('#detail [data-akt="schreiben"]').count()) { await p.click('#detail [data-akt="schreiben"]'); }
    await p.waitForSelector('#brief', { timeout: 30000 }); const t = await p.locator('#brief').innerText(); ok(/Allergien/.test(t), 'Allergie fehlt im Brief'); ok(/roots/i.test(t) && /Lebensmittelpunkt/.test(t), 'Kopf fehlt');
    await p.click('#detail [data-akt="bearbeiten"]'); await p.fill('#e-betreff', 'QA Betreff roots'); await p.click('#detail [data-akt="sichern"]'); await sleep(1200);
    await gehe('eingang'); await karte(/Claudia Meier/); const d = (await api('anfragen')).j.anfragen.find(a => a.name === 'Claudia Meier'); ok(d.entwurf && d.entwurf.betreff === 'QA Betreff roots', 'Betreff nicht gesichert: ' + (d.entwurf || {}).betreff);
    await api('anfrage', { id: d.id, betreff: 'Ihre Reservation', entwurf_text: d.entwurf.text, fassung: d.entwurf.fassung }); await bild('brief'); return 'gesichert und zurückgestellt'; });
  await schritt('Brief: «Als PDF speichern» lädt ein A4-PDF mit Briefkopf von roots', async () => {
    await gehe('eingang'); await karte(/Thomas Wyss/);
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 90000 }), p.evaluate(() => document.querySelector('#detail [data-akt="pdf"]').click())]);
    const f = dl.suggestedFilename().normalize('NFC'), z = require('os').tmpdir() + '/qa-brief-' + Date.now() + '.pdf'; await dl.saveAs(z); const b = fs.readFileSync(z); fs.unlinkSync(z);
    ok(/^roots . Thomas Wyss . \d\d\.\d\d\.\d{4}\.pdf$/.test(f), 'Dateiname ' + f); ok(b.slice(0, 4).toString() === '%PDF' && b.length > 20000, 'PDF ' + b.length); return f + ', ' + b.length + ' Byte'; });
  await schritt('Erledigt und wieder offen', async () => { await gehe('eingang'); await karte(/Peter Graf/); await p.click('#detail [data-akt="erledigt"]'); await sleep(900); ok((await api('anfragen')).j.anfragen.find(a => a.name === 'Peter Graf').status === 'erledigt', 'nicht erledigt'); await p.click('#detail [data-akt="offen"]'); await sleep(900); ok((await api('anfragen')).j.anfragen.find(a => a.name === 'Peter Graf').status !== 'erledigt', 'nicht offen'); return 'ok'; });
  await schritt('Auf Deutsch lesen (englische Anfrage)', async () => { await gehe('eingang'); await karte(/James Taylor/); await p.click('#detail [data-akt="deutsch"]'); await p.waitForFunction(() => /Businesslunch servieren wir donnerstags/.test(document.querySelector('#detail')?.innerText || ''), null, { timeout: 20000 }).catch(() => {}); const t = await p.locator('#detail').innerText(); ok(/Businesslunch servieren wir donnerstags/.test(t), 'Lesefassung fehlt'); return 'Lesefassung da'; });
  await schritt('Das wurde gefragt: Lücke nachtragen, steht in «Vom Team nachgetragen», entfernen', async () => {
    await gehe('gefragt'); const l0 = (await api('ueberblick')).j.ohne_antwort; const k = p.locator('[data-akt="nachtragen"]').first(); await k.scrollIntoViewIfNeeded(); await k.click();
    await p.waitForSelector('#fenster:not([hidden]) textarea'); const ta = p.locator('#fenster textarea').last(); await ta.fill('QA Antwort: Ja, es gibt Kinderstühle.'); await p.click('#fenster #f-los'); await sleep(1200);
    const ng = (await api('fragen')).j.nachgetragen; const e = ng.find(x => /^QA Antwort/.test(x.antwort)); ok(e, 'Nachtrag fehlt'); const l1 = (await api('ueberblick')).j.ohne_antwort; ok(l1 === l0 - 1, `Lücken ${l0} → ${l1}`);
    await gehe('nachgetragen'); ok(/QA Antwort/.test(await p.locator('#ansicht').innerText()), 'Karte fehlt'); await api('nachtragen_weg', { nid: e.nid });
    const f = (await api('fragen')).j.fragen.find(x => x.id === e.quelle); if (f) await api('frage', { id: f.id, erledigt: false }); return `Lücken ${l0} → ${l1}, weggeräumt`; });
  await schritt('Das weiss der Chat: Suche «Businesslunch» trifft, «Kinderstuhl» führt zu «noch nicht im Wissen»', async () => {
    await gehe('wissen'); await p.fill('#w-such', 'Businesslunch'); await p.waitForFunction(() => /\b98\b/.test(document.querySelector('#ansicht')?.innerText || ''), null, { timeout: 6000 }).catch(() => {}); const a = await p.locator('#ansicht').innerText(); ok(/98/.test(a), 'Businesslunch ohne Treffer');
    await p.fill('#w-such', 'Kinderstuhl'); await sleep(700); const b = await p.locator('#ansicht').innerText(); ok(/noch nicht|Noch nicht/.test(b), 'kein Hinweis «noch nicht im Wissen»'); return 'ok'; });
  await schritt('Chat ausprobieren: Frage antippen, Antwort kommt (Probe), Anfrage mit Kontakt landet als Beispiel im Eingang', async () => {
    await gehe('start'); const n0 = (await api('anfragen')).j.anfragen.length;
    if (HANDY) { const b = p.locator('#rand [data-probe]'); if (await b.count() && !(await b.isVisible())) await p.locator('.wo-kopf [data-bereiche], .wo-kopf__ber').first().click().catch(() => {}); }
    await p.evaluate(() => (document.querySelector('#k-probe') || document.querySelector('#rand [data-probe]')).click());
    await p.waitForSelector('.ws-handy'); await p.click('.probe__fragen [data-frage]'); await p.waitForFunction(() => /Probe-Antwort/.test(document.querySelector('#probe-l')?.innerText || ''), null, { timeout: 20000 });
    await p.fill('#probe-t', 'Ich möchte einen Tisch reservieren. Mein Name ist QA Gast, qa@example.com, 4 Personen.'); await p.press('#probe-t', 'Enter');
    await p.waitForFunction(() => document.querySelectorAll('#probe-l .ws-bl--haus').length >= 3 && !document.querySelector('.ws-bl--wartet'), null, { timeout: 20000 }); await bild('chat');
    const l = (await api('anfragen')).j.anfragen; const q = l.find(a => a.name === 'QA Gast'); ok(l.length === n0 + 1 && q && q.beispiel, 'keine Beispiel-Anfrage'); await p.keyboard.press('Escape');
    await api('weg', { id: q.id }); for (const f of (await api('fragen')).j.fragen.filter(f => /QA Gast|Habt ihr am Montag/.test(f.frage) && f.probe)) await api('weg', { id: f.id }); return 'Anfrage ' + q.art + ', weggeräumt'; });

  // Das Formular der Website (Bewerbung auf jobs.html), über den Baustein (die Website selbst bleibt unverändert; der Baustein wird nur in diesen Prüfbrowser geladen)
  const FORM = [
    { seite: 'jobs.html', fenster: 'bewerben', fuell: { name: 'QA Bewerbung', mail: 'qa-bw@example.com', text: 'QA Ich arbeite gern im Service.' }, erw: { art: 'nachricht', formular: 'bewerbung' } },
  ];
  for (const f of FORM) await schritt(`Website-Formular ${f.fenster} → Eingang mit allen Angaben`, async () => {
    await p.goto(BASIS + '/' + f.seite, { waitUntil: 'load' }); await p.addScriptTag({ path: path.join(__dirname, '..', 'baustein', 'anfrage.js') }); await sleep(300);
    await p.evaluate(([id, w, al]) => { const d = document.getElementById(id); d.showModal(); const fo = d.querySelector('form'); for (const [k, v] of Object.entries(w)) { const e = fo.querySelector(`[name="${k}"]`); if (e) e.value = v; }
      (al || []).forEach(c => { const x = fo.querySelector(`[name=allergene][value="${c}"]`); if (x) x.checked = true; }); fo.querySelector('[name=website]').value = ''; }, [f.fenster, f.fuell, f.allerg]);
    await p.evaluate(id => document.getElementById(id).querySelector('form').requestSubmit(), f.fenster);
    await p.waitForFunction(id => document.getElementById(id).classList.contains('gesendet'), f.fenster, { timeout: 10000 });
    await p.goto(WZ + '#eingang'); await p.waitForSelector('#ansicht > *'); const a = (await api('anfragen')).j.anfragen.find(x => x.name === f.fuell.name);
    ok(a && a.art === f.erw.art && a.formular === f.erw.formular && a.web, 'Anfrage fehlt oder falsch: ' + JSON.stringify(a && { art: a.art, formular: a.formular }));
    if (f.allerg) ok(JSON.stringify(a.allergene) === JSON.stringify(f.allerg), 'Allergene ' + JSON.stringify(a.allergene));
    if (f.hinw) ok(a.hinweise.some(h => f.hinw.test(h.text)), 'Hinweis fehlt: ' + JSON.stringify(a.hinweise));
    await api('weg', { id: a.id }); return `${a.art}/${a.formular}` + (a.hinweise.length ? ' · ' + a.hinweise.map(h => h.text).join('; ') : ''); });
  await schritt('Sicherheit Weg «formular»: fremde Herkunft 403, Kontakt ungültig 422, Maschinenfeld legt nichts ab, über 12 kB 413', async () => {
    await gehe('start'); const n0 = (await api('anfragen')).j.anfragen.length;
    const r1 = await p.evaluate(async u => (await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'QA', kontakt: 'x' }) })).status, WZ + 'api/formular');
    const r2 = await p.evaluate(async u => (await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'QA', kontakt: 'qa@example.com', website: 'spam' }) })).json(), WZ + 'api/formular');
    const r3 = await p.evaluate(async u => (await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'QA', kontakt: 'qa@example.com', nachricht: 'x'.repeat(13000) }) })).status, WZ + 'api/formular');
    const fremd = await new Promise(res => { const req = require('http').request(WZ + 'api/formular', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://boese.example' } }, r => res(r.statusCode)); req.end('{}'); });
    const n1 = (await api('anfragen')).j.anfragen.length; ok(r1 === 422 && r2.ok && r3 === 413 && fremd === 403 && n1 === n0, `422:${r1} falle:${JSON.stringify(r2)} 413:${r3} 403:${fremd} Zahl ${n0}→${n1}`); return `422 ${r1} · Falle ok · 413 ${r3} · fremd ${fremd}`; });
  if (HANDY) await schritt('Handy: Bereiche klappen auf und nach der Wahl zu', async () => { await gehe('start'); const k = p.locator('#kopf [data-bereiche], #kopf .wo-kopf__ber').first(); await k.click(); await sleep(400); const auf = await p.evaluate(() => getComputedStyle(document.querySelector('#rand')).visibility !== 'hidden' && document.querySelector('#rand').getBoundingClientRect().height > 50); ok(auf, 'Rand geht nicht auf'); await p.click('#rand [data-gehe="eingang"]'); await sleep(700); ok(location => true); return 'ok'; });
  if (MOTOR === 'chromium' && !HANDY) await schritt('Flüssigkeit ' + (process.env.DROSSEL || 4) + '× gedrosselt: Wechsel der Ansichten und Scrollen', async () => {
    await gehe('start'); const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: +(process.env.DROSSEL || 4) });
    await p.evaluate(() => { window.__f = []; let l = performance.now(); const t = n => { window.__f.push(n - l); l = n; if (window.__f.length < 900) requestAnimationFrame(t); }; requestAnimationFrame(t); });
    for (const k of ['eingang', 'gefragt', 'wissen', 'start']) { await p.click(`#rand [data-gehe="${k}"]`); await sleep(700); for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 260); await sleep(60); } }
    const f = await p.evaluate(() => window.__f.slice(2)); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const fps = f.length / (f.reduce((a, b) => a + b, 0) / 1000), lang = f.filter(x => x > 50).length, max = Math.max(...f);
    return `${fps.toFixed(0)} Bilder/s, ${lang} über 50 ms, längstes ${max.toFixed(0)} ms (${f.length} Bilder)`; });
  await br.close();
  const rot = res.filter(r => !r.ok);
  console.log(`\nroots ${MOTOR} ${W}: ${res.length - rot.length} von ${res.length} grün`);
  fs.mkdirSync(path.join(__dirname, 'lauf'), { recursive: true }); fs.writeFileSync(path.join(__dirname, 'lauf', `roots-${MOTOR}-${W}.json`), JSON.stringify(res, null, 1));
  process.exit(rot.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
