/* Anleitung Besucher · roots: Bild gross mit Klick, Esc schliesst; das Zeichen des Hauses (das «r» mit Wurzelwerk, kleid/roots-zeichen.svg)
   (eigene Datei: online laufen eingebettete Skripte ohne Prüfsumme nicht). */
(function () {
  var g = document.getElementById('gross'), im = g.querySelector('img');
  function zu() { g.hidden = true; }
  document.addEventListener('click', function (e) { var b = e.target.closest('.bild'); if (b) { im.src = b.querySelector('img').src; im.alt = b.querySelector('img').alt; g.hidden = false; } else if (e.target.closest('#gross')) zu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') zu(); });
  /* Auftritte beim Scrollen: Kapitel unter dem ersten Bild schweben herein (im ersten Bild stehen sie sofort) */
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
    var kap = [].slice.call(document.querySelectorAll('.kap')).filter(function (k) { return k.getBoundingClientRect().top > innerHeight; });
    if (kap.length) {
      document.documentElement.classList.add('js-auf');
      var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('da'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px 8% 0px' });
      [].forEach.call(document.querySelectorAll('.kap'), function (k) { if (kap.indexOf(k) < 0) k.classList.add('da'); else io.observe(k); });
    }
  }
  fetch('/assets/oberflaeche/kleid/roots-zeichen.svg').then(function (r) { return r.text(); }).then(function (t) { var m = t.match(/<svg[^>]*>([\s\S]*)<\/svg>/); if (m) document.getElementById('zeichen').innerHTML = m[1]; }).catch(function () {});
})();
