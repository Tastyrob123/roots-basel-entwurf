/* pruefung-haus.js · Prüfseite im Rahmen von roots (wie die Vorlage, 09.11.2026): «Zum Werkzeug» führt in «Website bearbeiten» des Hauses, nicht in den Stamm ohne Rahmen. */
(function () { var z = document.getElementById('wsp-zurueck'); if (z) z.href = '/_werkzeuge/bureau/'; var n = document.querySelector('[data-werkzeug]'); if (n && window.WO_HAUS) n.textContent = WO_HAUS.namen.website; })();
