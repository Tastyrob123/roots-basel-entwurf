/* roots, Basel · Bewegung und Funktionen. Nur transform/opacity, nativer Scroll, Auftritte nach der Uhr, ausgelöst am Bildschirmrand. */
(function () {
  var ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var de = document.documentElement;

  /* Überschriften in echte Zeilen teilen (für den Schlitz) */
  function zeilen(el) {
    if (el.dataset.geteilt) return;
    var text = el.innerHTML.trim();
    var tmp = document.createElement('div'); tmp.innerHTML = text;
    var teile = [];
    (function lauf(n, cls) {
      n.childNodes.forEach(function (c) {
        if (c.nodeType === 3) c.textContent.split(/(\s+)/).forEach(function (w) { if (w.trim()) teile.push({ w: w, cls: cls }); });
        else if (c.nodeName === 'BR') teile.push({ br: true });
        else lauf(c, c.className || cls);
      });
    })(tmp, '');
    /* eine Zahl bleibt mit dem folgenden Wort zusammen (kein «18» allein am Zeilenende) */
    for (var i = teile.length - 2; i >= 0; i--) if (!teile[i].br && !teile[i + 1].br && /^[\d'.,]+$/.test(teile[i].w) && teile[i].cls === teile[i + 1].cls) { teile[i].w += '\u00a0' + teile[i + 1].w; teile.splice(i + 1, 1); }
    for (var j = teile.length - 1; j > 0; j--) if (!teile[j].br && !teile[j - 1].br && /^[\d'.,]+$/.test(teile[j].w) && teile[j].cls === teile[j - 1].cls) { teile[j - 1].w += '\u00a0' + teile[j].w; teile.splice(j, 1); }
    el.innerHTML = teile.map(function (t) { return t.br ? '<br>' : '<span class="w' + (t.cls ? ' ' + t.cls : '') + '">' + t.w + '</span>'; }).join(' ');
    var ws = el.querySelectorAll('.w'), reihen = [], oben = null;
    ws.forEach(function (w) { var y = Math.round(w.offsetTop); if (y !== oben) { reihen.push([]); oben = y; } reihen[reihen.length - 1].push(w.outerHTML); });
    el.innerHTML = reihen.map(function (r) { return '<span class="z"><span>' + r.join(' ') + '</span></span>'; }).join('');
    el.dataset.geteilt = '1';
  }

  function los() {
    if (ruhig) { document.querySelectorAll('[data-r],[data-zeilen],.weg__reihe').forEach(function (e) { e.classList.add('da'); }); return; }
    var io = new IntersectionObserver(function (ein) {
      ein.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('da'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -4% 0px', threshold: 0 });
    document.querySelectorAll('[data-r],[data-zeilen],.weg__reihe').forEach(function (e) { if (!e.closest('.durchblick')) io.observe(e); });
  }

  /* Erster Blick: erst zeigen, wenn die Bilder im ersten Bild geladen sind (nur load), dann alles in einem Moment */
  var erst = [].slice.call(document.querySelectorAll('img[data-erst]'));
  var fertig = false;
  function zeigen() {
    if (fertig) return; fertig = true;
    document.querySelectorAll('[data-zeilen]').forEach(zeilen);
    de.classList.remove('vor');
    requestAnimationFrame(function () {
      de.classList.add('auf');
      document.querySelectorAll('.auftakt [data-zeilen],.kopf [data-zeilen]').forEach(function (h) { h.classList.add('da'); });
      los();
    });
  }
  var schrift = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.all(erst.map(function (i) { return i.complete ? 1 : new Promise(function (r) { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }); }).concat([schrift])).then(zeigen);
  /* Nach dem ersten Bild alle übrigen Fotos vorausladen, damit sie da sind, bevor man hinkommt */
  addEventListener('load', function () { setTimeout(function () { document.querySelectorAll('img[loading="lazy"]').forEach(function (i) { i.loading = 'eager'; }); }, 300); });
  setTimeout(zeigen, 3000);

  /* Leiste: weg beim Hinunter-, zurück beim Hinaufscrollen; Fläche, sobald der Auftakt verlassen ist */
  var leiste = document.querySelector('.leiste'), letzte = scrollY, takt = false;
  function leisteTakt() {
    var y = scrollY, h = innerHeight * 0.6;
    if (leiste) {
      leiste.classList.toggle('flaeche', y > h);
      if (y > letzte + 6 && y > 120) leiste.classList.add('weg');
      else if (y < letzte - 6 || y < 120) leiste.classList.remove('weg');
    }
    letzte = y; takt = false;
  }
  addEventListener('scroll', function () { if (!takt) { takt = true; requestAnimationFrame(leisteTakt); } }, { passive: true });
  leisteTakt();

  /* Handy-Menü */
  var hm = document.querySelector('.handymenue');
  document.querySelectorAll('[data-menue]').forEach(function (b) { b.addEventListener('click', function () { hm.classList.toggle('offen'); }); });
  if (hm) hm.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { hm.classList.remove('offen'); }); });

  /* Durchblicke: das stehende Bild nur zeigen, solange sein Ausschnitt im Bild ist */
  /* Der Satz rollt herein, sobald der Ausschnitt ihn zu etwa einem Drittel freigibt */
  var dio = new IntersectionObserver(function (ein) { ein.forEach(function (e) {
    e.target.classList.toggle('an', e.isIntersecting);
    if (e.intersectionRatio >= 0.33 && fertig) { var s = e.target.querySelector('[data-zeilen]'); if (s) s.classList.add('da'); }
  }); }, { threshold: [0, 0.33, 0.6] });
  document.querySelectorAll('.durchblick').forEach(function (d) { dio.observe(d); });

  /* Reservieren: das Buchungsfenster des Hauses (aleno) in einem Blatt auf der Seite */
  var dlg = document.getElementById('reservieren');
  document.querySelectorAll('[data-reservieren]').forEach(function (b) {
    b.addEventListener('click', function (ev) {
      ev.preventDefault(); if (!dlg) return;
      var f = dlg.querySelector('iframe'); if (!f.src) f.src = f.dataset.src;
      if (hm) hm.classList.remove('offen');
      dlg.showModal();
    });
  });
  document.querySelectorAll('dialog').forEach(function (d) {
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    d.querySelectorAll('[data-zu]').forEach(function (z) { z.addEventListener('click', function () { d.close(); }); });
  });

  /* Gänge wählen: Menüpreis und Getränkebegleitung tauschen an Ort und Stelle */
  document.querySelectorAll('.gaenge').forEach(function (g) {
    var knoepfe = g.querySelectorAll('[data-g]');
    function setze(k) {
      knoepfe.forEach(function (x) { x.setAttribute('aria-pressed', x === k ? 'true' : 'false'); });
      ['menue', 'mit', 'ohne'].forEach(function (n) { var z = g.querySelector('[data-p="' + n + '"]'); if (z) z.textContent = k.dataset[n]; });
    }
    knoepfe.forEach(function (k) { k.addEventListener('click', function () { setze(k); }); });
  });

  /* Team-Band: Pfeile blättern um eine Karte, nativer Seitwärts-Scroll */
  document.querySelectorAll('.team-band').forEach(function (t) {
    var spur = t.querySelector('.team-band__spur');
    t.querySelectorAll('[data-band]').forEach(function (b) { b.addEventListener('click', function () {
      var k = spur.querySelector('.band__k'); var w = k ? k.getBoundingClientRect().width + 14 : 300;
      spur.scrollBy({ left: +b.dataset.band * w, behavior: 'smooth' });
    }); });
  });

  /* Bewerbung: Formular-Blatt statt Mailprogramm (Studie: nichts wird verschickt) */
  var bew = document.getElementById('bewerben');
  document.querySelectorAll('[data-bewerben]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); bew && bew.showModal(); }); });
  document.querySelectorAll('.formular').forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); f.classList.add('gesendet'); }); });
  /* Szenen: Die Bühne steht, das Scrollen spielt die Bewegung. Ein Takt, nur transform und opacity, nur solange die Szene im Bild ist. */
  var szenen = [].slice.call(document.querySelectorAll('[data-szene]'));
  if (szenen.length) {
    var klemm = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
    var weich = function (x) { x = klemm(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
    var szLauf = false;
    var szTakt = function (neu) {
      szLauf = false; var vh = innerHeight;
      szenen.forEach(function (s) {
        var r = s.getBoundingClientRect();
        if (!r.height || r.bottom < -vh || r.top > 2 * vh) return;
        var k = s.querySelector('.sz__strecke'); if (!k) return; var rk = k.getBoundingClientRect();
        var p = ruhig ? 1 : s.dataset.szene === 'tiefe' ? klemm((vh - rk.top) / (rk.height + vh)) : klemm(-rk.top / Math.max(rk.height - vh, 1)), d = s.style;
        d.setProperty('--p', p.toFixed(4));
        d.setProperty('--a', weich(p / .38).toFixed(4));
        d.setProperty('--b', weich((p - .32) / .33).toFixed(4));
        d.setProperty('--c', weich((p - .6) / .32).toFixed(4));
        d.setProperty('--o', weich(p / .75).toFixed(4));
        d.setProperty('--w0', weich(p / .12).toFixed(4));
        [[.14, .2], [.40, .2], [.66, .2]].forEach(function (z, i) { d.setProperty('--w' + (i + 1), weich((p - z[0]) / z[1]).toFixed(4)); });
        if (s.dataset.szene === 'fenster') d.setProperty('--s', (.34 + .66 * weich(p / .62)).toFixed(4));
        if (s.dataset.szene === 'quer') { if (neu === true || !s.dataset.weg) { var t = s.querySelector('.sz5__spur'); s.dataset.weg = t.scrollWidth - innerWidth; } d.setProperty('--weg', s.dataset.weg + 'px'); }
      });
    };
    addEventListener('scroll', function () { if (!szLauf) { szLauf = true; requestAnimationFrame(szTakt); } }, { passive: true });
    addEventListener('resize', function () { szTakt(true); });
    szTakt(true);
    window.rootsSzenen = szTakt;
  }
})();
