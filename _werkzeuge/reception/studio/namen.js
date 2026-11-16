/* Werkzeug-Namen nur aus der einen Stelle (Vorlage 20.10.2026): _werkzeuge/oberflaeche/kleid/roots.js → WO_HAUS.namen, gelesen über WO.name().
   Füllt jedes [data-wo-name="<schlüssel>"] und den Seitentitel aus <html data-wo-titel="… {name} …">. Nach oberflaeche.js laden. */
(function () {
  function los() {
    if (!window.WO) return;
    document.querySelectorAll('[data-wo-name]').forEach(function (e) { e.textContent = WO.name(e.getAttribute('data-wo-name')); });
    var t = document.documentElement.getAttribute('data-wo-titel'); if (t) document.title = t.replace('{name}', WO.name('gaeste'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', los); else los();
  window.WO_NAMEN_SETZEN = los;
})();
