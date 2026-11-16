/* kleid/roots.js · Hauswerte für oberflaeche.js (roots, Basel, 09.11.2026). Im <head> VOR allen Stilen laden (ohne defer).
   Rahmen «Die Bühne» wie die Vorlage Wirtschaft am Schlössli (gesetzt, nicht von Robert gewählt; Wechsel = eine Zeile hier).
   Liegt unter _werkzeuge/oberflaeche/ und wird von den Werkzeug-Servern unter /assets/oberflaeche/ ausgeliefert.
   Foto: der Saal mit den Wurzel-Leuchtern (eine Aussenansicht des Hauses gibt es nicht, CHARAKTER.md Abschnitt 5). */
window.WO_HAUS = { kurz: 'roots', name: 'roots', voll: 'roots Basel', ort: 'Basel', welt: 'land', rahmen: 'buehne',
  foto: '/assets/img/saal-1400.webp', zeichen: '/assets/oberflaeche/kleid/roots-zeichen.svg', zeichenMass: 1.037,
  /* Namen der sieben Werkzeuge: der Zweck in Alltagsworten (Werkzeug-Auftrag Punkt 3, Fehlerbuch 08.11.2026). Die EINE Stelle; Dateien, Schlüssel und Adressen bleiben. */
  namen: { zentrale: 'Kontrollpanel', website: 'Website bearbeiten', karten: 'Karten & Preislisten', gaeste: 'Anfragen & Chat', marke: 'Markenbuch', besuche: 'Besucher', druck: 'Drucksachen & Feed' },
  wege: { zentrale: '/_werkzeuge/maison/', website: '/_werkzeuge/bureau/', karten: '/_werkzeuge/carte/', gaeste: '/_werkzeuge/reception/', marke: '/_werkzeuge/livre/', besuche: '/_werkzeuge/registre/', druck: '/_werkzeuge/imprimerie/' } };
document.documentElement.setAttribute('data-wo-haus', WO_HAUS.kurz);
document.documentElement.setAttribute('data-wo-rahmen', WO_HAUS.rahmen);
try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
