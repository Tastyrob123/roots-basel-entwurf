/* Besucher · roots, Basel: Zählung auf der Website (Tasty Studios 09.11.2026). VORSCHLAG, noch nicht eingebaut und nicht einzuschalten,
   bis Robert es sagt: der Einbau in _werk/bau.py und das Hochladen gehören dem Website- bzw. Werkbank-Chat von roots. Ziel: assets/js/messung.js, auf jeder
   Seite vor </body> als <script src="assets/js/messung.js?v=…" defer></script>, nach roots.js. Erst einbauen, wenn der Server der Website /api/registre
   annimmt (Fehlerbuch 10a, 28.10.2026: sonst zeigt jede Seite «501» in der Konsole) und das Haus einen eigenen Zähl-Schlüssel hat (anschluss.py).
   Vorbild: messung.js der Vorlage (AUFTRAG-GEMEINSAM.md), dort des Berghotel Gasterntal; Ereignisse von roots.

   Je Seite geht eine Zeile an /api/registre (lokal der Server von Besucher, online die Funktion api/registre.py, gleiche Adresse):
       r1 <seitenaufruf> <datei> <sprache> <geraet> <sekunden> <ereignisse|-> <herkunft|->
   einmal beim Öffnen (0 Sekunden), bei jedem gezählten Klick und beim Verlassen (Sekunden, in denen die Seite sichtbar war).
   Ohne Cookies und ohne Kennung im Gerät: «seitenaufruf» ist eine Zufallsfolge, die nur in dieser Variablen lebt und mit der Seite endet.
   Dass die Seiten eines Besuchs zusammenfinden, Land und Ort bestimmt der Server aus der Verbindung (registre.py); die Adresse speichert er nicht.
   «herkunft» ist nur der Name der Website, von der der Gast kam (zum Beispiel guide.michelin.com), nie die ganze Adresse.
   «sprache» ist die Sprache des Browsers (die Website gibt es nur deutsch), sonst «xx».
   Nicht gezählt: automatische Browser (Prüfläufe), Seiten im Rahmen, die Werkzeuge und die Werkbank, die Wahlseiten (*-wahl*.html) und Geräte
   mit der Marke «roots-nicht-zaehlen» im localStorage (das Einzige, was je im Gerät steht).
   Die Fenster der Website (assets/js/roots.js) bleiben unberührt: gezählt wird nur, dass etwas geöffnet, begonnen oder abgeschickt wurde, nie ein Inhalt.

   Ereignisse (Schlüssel wie in allen Häusern, Bedeutung bei roots, Werkzeug-Master G14):
     fenster  Fenster «Tisch reservieren» geöffnet (Knopf oder Link mit data-reservieren, öffnet dialog#reservieren mit der Maske von aleno)
     booking  Reservation bei aleno begonnen: im offenen Fenster in die Maske von aleno getippt (der Fokus geht in den Rahmen; was dort steht, sieht nur aleno)
     buchung  Gruppe angefragt: im Fenster «Tisch reservieren» die Mail-Adresse für Gruppen ab sechs Personen angeklickt
     tisch    Gutschein-Shop geöffnet (Link zu shop.e-guma.ch)
     anfrage  Bewerbung abgeschickt: das Fenster «Bewerbung» auf «Jobs» (dialog#bewerben) zeigt danach «Danke» (Klasse «gesendet» am Formular)
     anruf    Telefonnummer des Hauses angeklickt (+41 61 322 10 56)
     mail     Mail-Adresse angeklickt (mailto:, ausserhalb des Fensters «Tisch reservieren»)
     chat     Instagram geöffnet (instagram.com/roots_basel); die Website hat keinen Gäste-Chat, der Schlüssel bleibt wie in den anderen Häusern
     route    Anfahrt angesehen: die gezeichnete Karte «Anfahrt» auf «Kontakt» war zur Hälfte im Bild (die Website hat keinen Routen-Link) */
(function () {
  'use strict';
  var n = navigator, d = document, w = window;
  if (w.__registre || !n.sendBeacon || n.webdriver || w.self !== w.top) return;
  try { if (w.localStorage.getItem('roots-nicht-zaehlen') === '1') return; } catch (e) { /* privat: zählt normal */ }
  var teile = location.pathname.split('/'), datei = teile.pop() || 'index.html';
  if (teile.length > 2 || /^(studio|_werkzeuge|werkzeuge|werkbank|_werkbank|maison|marke|reception|registre|imprimerie|unterlagen|drucksachen|feed|material)$/.test(teile[1] || '')) return;
  if (!/^[a-z0-9-]{1,60}\.html$/.test(datei) || /-wahl|^konzept|^vorschau|^404/.test(datei)) return;
  w.__registre = 1;
  var SPRACHEN = ' de en fr it nl es pt zh ja ko ar ';
  var sp = String(n.language || 'de').slice(0, 2).toLowerCase();
  if (SPRACHEN.indexOf(' ' + sp + ' ') < 0) sp = 'xx';
  var breit = function (px) { return !!(w.matchMedia && w.matchMedia('(max-width:' + px + 'px)').matches); };
  var geraet = breit(700) ? 'handy' : breit(1060) ? 'tablet' : 'rechner';
  var her = '-';
  try { var r = d.referrer ? new URL(d.referrer).hostname.toLowerCase() : ''; if (r && r !== location.hostname && /^[a-z0-9.-]{3,60}$/.test(r)) her = r; } catch (e) {}
  var HAUS_TEL = /^tel:\+?(41613221056|0613221056)$/;
  var pv, war, liste, sichtbar, seit, gesendet;
  function neu() {
    pv = (Math.random().toString(36) + '000000').slice(2, 8);
    war = {}; liste = []; sichtbar = 0; gesendet = '';
    seit = d.visibilityState === 'hidden' ? 0 : Date.now();
    sende();
  }
  function sek() { return Math.min(1800, Math.round((sichtbar + (seit ? Date.now() - seit : 0)) / 1000)); }
  function sende() {
    var zeile = 'r1 ' + pv + ' ' + datei + ' ' + sp + ' ' + geraet + ' ' + sek() + ' ' + (liste.length ? liste.join(',') : '-') + ' ' + her;
    if (zeile === gesendet) return;
    gesendet = zeile;
    try { n.sendBeacon('/api/registre', zeile); } catch (e) {}   /* wartet auf keine Antwort */
  }
  function zaehle(was) {
    if (war[was]) return;
    war[was] = 1; liste.push(was);
    sende();
  }
  function weg() { if (seit) { sichtbar += Date.now() - seit; seit = 0; } sende(); }
  neu();
  d.addEventListener('visibilitychange', function () { if (d.visibilityState === 'hidden') weg(); else if (!seit) seit = Date.now(); });
  w.addEventListener('pagehide', weg);
  w.addEventListener('pageshow', function (e) { if (e.persisted) neu(); });   /* zurück aus dem Seitenspeicher des Browsers: neuer Aufruf */

  d.addEventListener('click', function (e) {
    var t = e.target; if (!t || !t.closest) return;
    if (t.closest('[data-reservieren]')) { zaehle('fenster'); return; }
    var a = t.closest('a[href]'); if (!a) return;
    var h = (a.getAttribute('href') || '').replace(/\s/g, ''), host = (a.hostname || '').toLowerCase();
    if (/^mailto:/i.test(h)) zaehle(a.closest('#reservieren') ? 'buchung' : 'mail');
    else if (/^tel:/i.test(h)) { if (HAUS_TEL.test(h)) zaehle('anruf'); }
    else if (/(^|\.)e-guma\.ch$/.test(host)) zaehle('tisch');
    else if (/(^|\.)instagram\.com$/.test(host)) zaehle('chat');
  }, true);
  /* Reservation bei aleno begonnen: die Maske liegt in einem fremden Rahmen; tippt der Gast hinein, verliert die Seite den Fokus an diesen Rahmen. */
  w.addEventListener('blur', function () {
    setTimeout(function () { var dlg = d.getElementById('reservieren'); if (dlg && dlg.open && d.activeElement && d.activeElement.tagName === 'IFRAME' && dlg.contains(d.activeElement)) zaehle('booking'); }, 0);
  });
  /* Bewerbung abgeschickt ist sie erst, wenn das Formular «gesendet» trägt (roots.js setzt die Klasse; Pflichtfelder leer: kein submit, nichts gezählt). */
  d.addEventListener('submit', function (e) {
    var fm = e.target; if (!fm || !fm.closest || !fm.closest('#bewerben')) return;
    var bis = Date.now() + 20000;
    (function schau() { if (fm.classList.contains('gesendet')) { zaehle('anfrage'); return; } if (Date.now() < bis) setTimeout(schau, 250); })();
  }, true);
  /* Anfahrt angesehen: die gezeichnete Karte auf «Kontakt» zur Hälfte im Bild */
  var anf = d.querySelector('section[aria-label="Anfahrt"]');
  if (anf && w.IntersectionObserver) { var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { zaehle('route'); io.disconnect(); } }); }, { threshold: 0.5 }); io.observe(anf); }
})();
