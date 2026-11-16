/* Hilfe: leitet in das Werkzeug mit offenem Demo-Video; die Herkunft aus der Werkbank (wb, wy, wbo, wbu) geht mit. */
(function () {
  var q = new URLSearchParams(location.search), z = new URLSearchParams({ hilfe: 'video' });
  ['wb', 'wy', 'wbo', 'wbu'].forEach(function (k) { if (q.get(k)) z.set(k, q.get(k)); });
  location.replace('../?' + z.toString());
})();
