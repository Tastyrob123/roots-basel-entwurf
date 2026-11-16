/* Anschluss der Formulare der Website an «Anfragen & Chat» · roots, Basel (09.11.2026, Kopie der abgenommenen Vorlage, Master Werkzeug-Bau E12/E24/E33).
   Die neue Website hat ein eigenes Formular: die Bewerbung auf jobs.html (dialog#bewerben, form.formular). Bisher zeigte es nur den Dank (Designstudie, nichts ging weg).
   Mit diesem Baustein geht die Bewerbung in den Eingang des Werkzeugs; erst wenn das Werkzeug sie angenommen hat, setzt der Baustein «gesendet», so dass der Dank erscheint.
   Nie mailto, nie ein Mailprogramm. Die Reservation (aleno) bleibt, wie sie ist.
   Der Baustein fängt das Abschicken im Fang-Durchlauf am Dokument ab, bevor roots.js «gesendet» setzt (roots.js unverändert).
   Einbinden (Station 14, Werkbank-Bauer, über _werk/bau.py, nicht von Hand): <script src="assets/js/anfrage.js?v={V}" defer></script> nach roots.js.
   Ziel: /_werkzeuge/reception/api/formular (anders mit <script … data-api="/pfad"> oder window.WS_ANFRAGE_API). */
(function () {
  'use strict';
  var D = document, skript = D.currentScript;
  var API = window.WS_ANFRAGE_API || (skript && skript.getAttribute('data-api')) || '/_werkzeuge/reception/api/formular';
  var TEL = '+41 61 322 10 56';
  var $ = function (s, c) { return (c || D).querySelector(s); }, $$ = function (s, c) { return [].slice.call((c || D).querySelectorAll(s)); };
  var wert = function (f, n) { var e = f.querySelector('[name="' + n + '"]'); return e ? String(e.value || '').trim() : ''; };
  var seiteName = function () { var t = (D.title || '').split(' · ')[0].trim(); return /^roots/.test(t) ? 'Startseite' : t; };

  /* Was jedes Formular mitschickt: dieselben Felder, die der Gast ausgefüllt hat, in Zeilen für das Team */
  var FENSTER = {
    'bewerben': function (f) {
      var titel = ((f.closest('dialog') || f).querySelector('h2') || {}).textContent || 'Bewerbung';
      var z = ['Name: ' + wert(f, 'name'), 'E-Mail: ' + wert(f, 'mail')];
      if (wert(f, 'text')) z.push('Ein paar Sätze zu dir: ' + wert(f, 'text'));
      return { art: 'nachricht', formular: 'bewerbung', anliegen: titel.trim(), name: wert(f, 'name'), kontakt: wert(f, 'mail'), zeilen: z };
    }
  };

  /* Feld, das Menschen nicht sehen: nur Maschinen füllen es aus («Anfragen & Chat» nimmt solche Anfragen still an und legt nichts ab) */
  function falle(f) {
    if (f.querySelector('[name=website]')) return;
    var i = D.createElement('input'); i.type = 'text'; i.name = 'website'; i.tabIndex = -1; i.autocomplete = 'off'; i.setAttribute('aria-hidden', 'true');
    i.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
    f.appendChild(i);
  }
  function meldung(f, text) {
    var p = f.querySelector('.ws-anfrage-fehler');
    if (!p) { p = D.createElement('p'); p.className = 'fe__hinweis ws-anfrage-fehler'; p.setAttribute('role', 'alert'); (f.querySelector('.dank') || f.lastElementChild || f).insertAdjacentElement('beforebegin', p); }
    p.textContent = text; p.hidden = !text;
  }
  function senden(f, d, knopf, fertig) {
    if (f.dataset.sendet) return;
    f.dataset.sendet = '1'; if (knopf) knopf.disabled = true; meldung(f, '');
    var koerper = { art: d.art, formular: d.formular, name: d.name, kontakt: d.kontakt, datum: d.datum || '', uhrzeit: d.uhrzeit || '', personen: d.personen || '',
      platz: d.platz || '', allergene: d.allergene || [], anliegen: d.anliegen, nachricht: d.zeilen.join('\n'), seite: location.pathname + location.search,
      seite_name: seiteName(), sprache: (D.documentElement.lang || 'de').slice(0, 2), website: wert(f, 'website') };
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(koerper) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        if (!x.ok) throw new Error(String((x.j && x.j.fehler) || '').replace(/^[A-ZÄÖÜ-]+ · /, '') || 'Die Anfrage kam nicht an.');
        fertig();
      })
      .catch(function (e) { meldung(f, (e && e.message && !/fetch|network|load/i.test(e.message) ? e.message : 'Die Anfrage kam nicht an.') + ' Bitte noch einmal versuchen oder anrufen: ' + TEL + '.'); })
      .then(function () { delete f.dataset.sendet; if (knopf) knopf.disabled = false; });
  }

  D.addEventListener('submit', function (e) {
    var f = e.target, dlg = f.closest && f.closest('dialog');
    var bau = dlg && FENSTER[dlg.id];
    if (!bau) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!f.reportValidity()) return;
    senden(f, bau(f), f.querySelector('[type=submit]'), function () { f.classList.add('gesendet'); dlg.classList.add('gesendet'); });
  }, true);
  function bereit() { $$('dialog form.formular').forEach(falle); }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', bereit); else bereit();
})();
