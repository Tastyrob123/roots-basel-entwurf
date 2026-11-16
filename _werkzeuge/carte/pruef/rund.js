// Speisekarten (Karten & Preislisten) · roots · Rundlauf: setzt jede Karte aus ihren Daten mit satz.js und vergleicht die ganze Datei mit dem Satz aus dem Material des Hauses (satz/u-<karte>.html aus satz_roots.py).
// node _werkzeuge/carte/pruef/rund.js [daten-ordner]   (Standard: _daten/grundstand) → je Karte «gleich» oder die erste Abweichung
const fs = require('fs'), path = require('path');
const HIER = path.join(__dirname, '..'), WURZEL = path.join(HIER, '..', '..'), WB = HIER;   // roots: der Satz liegt im Werkzeug (satz/)
const SATZ = require(path.join(HIER, 'satz', 'satz.js'));
SATZ.zeichen(JSON.parse(fs.readFileSync(path.join(HIER, 'satz', 'zeichen.json'), 'utf8')));
const ordner = process.argv[2] || path.join(HIER, '_daten', 'grundstand');
let rot = 0;
for (const f of fs.readdirSync(ordner).filter(f => f.endsWith('.json')).sort()) {
  const d = JSON.parse(fs.readFileSync(path.join(ordner, f), 'utf8'));
  if (d.art === 'mittag') {   // Mittagsmenü der Woche (bei roots nicht eingeschaltet): das Blatt gegen u-mittag.html
    const h = fs.readFileSync(path.join(WB, 'satz', 'u-mittag.html'), 'utf8'), soll = h.slice(h.indexOf('<body>') + 6, h.lastIndexOf('</body>')), ist = SATZ.seiten(d).join('');
    let k = 0; while (k < soll.length && soll[k] === ist[k]) k++;
    const gleich = soll === ist; if (!gleich) rot++;
    console.log(`${d.ziel}: ${gleich ? `gleich dem Blatt des Mittagsmenüs (${ist.length} Zeichen)` : `ANDERS · Zeichen ${k}:\n   soll …${soll.slice(Math.max(0, k - 120), k + 140)}\n   ist  …${ist.slice(Math.max(0, k - 120), k + 140)}`}`);
    continue;
  }
  const soll = fs.readFileSync(path.join(WB, 'satz', 'u-' + d.ziel + '.html'), 'utf8');
  const ist = SATZ.dokument(d);
  let erste = '';
  if (soll !== ist) { let k = 0; while (soll[k] === ist[k]) k++; erste = `Zeichen ${k}:\n   soll …${soll.slice(Math.max(0, k - 100), k + 120)}\n   ist  …${ist.slice(Math.max(0, k - 100), k + 120)}`; }
  console.log(`${d.ziel}: ${erste ? 'ANDERS · ' + erste : `gleich (${d.seiten.length} Seiten, ${ist.length} Zeichen)`}`);
  if (erste) rot++;
}
process.exit(rot ? 1 : 0);
