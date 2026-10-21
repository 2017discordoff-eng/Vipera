/* Vipera – effets et interactions du site (aucune requête externe). */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cfg = window.KAYI || { repo: 'OWNER/vipera', version: '1.0.0' };

  /* ---------- version + liens de téléchargement ---------- */
  $$('[data-version]').forEach(function (e) { e.textContent = cfg.version; });
  var hasRepo = cfg.repo && cfg.repo.indexOf('OWNER/') !== 0;
  var releasesUrl = hasRepo ? 'https://github.com/' + cfg.repo + '/releases/latest' : '#installation';
  var ua = navigator.userAgent || '';
  var osNow = /Windows/i.test(ua) ? 'win' : /Mac/i.test(ua) && !/iPhone|iPad/i.test(ua) ? 'mac' : /Linux|X11/i.test(ua) && !/Android/i.test(ua) ? 'linux' : null;
  var osName = { win: 'Windows', mac: 'macOS', linux: 'Linux' };
  var direct = cfg.downloads || {};
  $$('[data-download]').forEach(function (a) {
    var os = a.getAttribute('data-os') || osNow;
    var url = (os && direct[os]) || releasesUrl;
    a.setAttribute('href', url);
    if (url !== '#installation') { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); }
    var lab = $('[data-dl-label]', a);
    if (lab && !a.getAttribute('data-os') && os && !/Vipera/.test(lab.textContent)) lab.textContent = 'Télécharger pour ' + osName[os];
  });

  /* ---------- titre : découpe en mots ---------- */
  var h1 = $('h1[data-split]');
  if (h1) {
    var i = 0;
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var inner = document.createElement('i'); inner.style.setProperty('--i', i++); inner.textContent = t;
            w.appendChild(inner); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(h1);
  }

  /* ---------- barre de progression + halo curseur ---------- */
  var bar = $('#progress'), glow = $('#cursor-glow');
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(scrollY / h, 1) : 0) + ')';
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    var gx = 0, gy = 0, tx = 0, ty = 0;
    addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; glow.classList.add('on'); }, { passive: true });
    (function loop() { gx += (tx - gx) * .12; gy += (ty - gy) * .12; glow.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)'; requestAnimationFrame(loop); })();
  }

  /* ---------- révélation au scroll ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' }) : null;
  $$('.reveal').forEach(function (el, k) {
    if (el.parentElement && /bento|limits|grid-3/.test(el.parentElement.className)) el.style.setProperty('--d', ((k % 4) * 0.08) + 's');
    io ? io.observe(el) : el.classList.add('in');
  });

  /* ---------- compteurs ---------- */
  var cio = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return; cio.unobserve(e.target);
      var el = e.target, to = +el.getAttribute('data-count'), suf = el.getAttribute('data-suffix') || '';
      if (reduce || to === 0) { el.textContent = to + suf; return; }
      var t0 = performance.now(), dur = 1400;
      (function step(t) { var p = Math.min((t - t0) / dur, 1), v = Math.round(to * (1 - Math.pow(1 - p, 3))); el.textContent = v + suf; if (p < 1) requestAnimationFrame(step); })(t0);
    });
  }, { threshold: .6 }) : null;
  $$('[data-count]').forEach(function (el) { cio ? cio.observe(el) : (el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || '')); });

  /* ---------- cartes : halo qui suit la souris ---------- */
  $$('[data-spot]').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- fenêtre du hero : flux de traqueurs bloqués + inclinaison ---------- */
  var feed = $('#feed'), count = $('#mock-count');
  var domains = ['doubleclick.net', 'google-analytics.com', 'connect.facebook.net', 'hotjar.com', 'criteo.com', 'scorecardresearch.com', 'taboola.com', 'adnxs.com', 'amazon-adsystem.com', 'clarity.ms', 'mixpanel.com', 'outbrain.com', 'fullstory.com', 'demdex.net'];
  var n = 128, di = 0;
  function addRow() {
    var r = document.createElement('div'); r.className = 'row';
    r.innerHTML = '<span></span><b>BLOQUÉ</b>'; r.firstChild.textContent = domains[di++ % domains.length];
    feed.insertBefore(r, feed.firstChild);
    while (feed.children.length > 7) feed.removeChild(feed.lastChild);
    count.textContent = ++n;
  }
  if (feed) { for (var k = 0; k < 5; k++) addRow(); if (!reduce) setInterval(addRow, 1300); }

  var stage = $('#stage'), win = $('#win');
  if (stage && !reduce && matchMedia('(pointer:fine)').matches) {
    stage.addEventListener('pointermove', function (e) {
      if (innerWidth < 1020) return;
      var r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      win.style.transform = 'rotateY(' + (-6 + x * 8) + 'deg) rotateX(' + (3 - y * 7) + 'deg)';
    });
    stage.addEventListener('pointerleave', function () { win.style.transform = ''; });
  }

  /* ---------- bascule "trajet" ---------- */
  var route = $('#route');
  $$('.toggle button', route).forEach(function (b) {
    b.addEventListener('click', function () {
      route.setAttribute('data-mode', b.getAttribute('data-m'));
      $$('.toggle button', route).forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
    });
  });

  /* ---------- onglets système d'exploitation ---------- */
  var inst = $('#install');
  function setOs(os) {
    inst.setAttribute('data-os', os);
    $$('.os-tabs button', inst).forEach(function (x) { x.setAttribute('aria-selected', x.getAttribute('data-os') === os ? 'true' : 'false'); });
    $$('.os-panel', inst).forEach(function (p) { p.hidden = p.getAttribute('data-os') !== os; });
  }
  $$('.os-tabs button', inst).forEach(function (b) { b.addEventListener('click', function () { setOs(b.getAttribute('data-os')); }); });
  setOs(osNow || 'win');

  /* ---------- copier une commande ---------- */
  $$('code.copy').forEach(function (c) {
    c.setAttribute('title', 'Cliquer pour copier'); c.setAttribute('tabindex', '0');
    var doCopy = function () {
      var txt = c.getAttribute('data-copy'), old = c.innerHTML;
      var done = function () { c.classList.add('ok'); c.textContent = 'Copié ✓'; setTimeout(function () { c.classList.remove('ok'); c.innerHTML = old; }, 1400); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () {});
    };
    c.addEventListener('click', doCopy);
    c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doCopy(); } });
  });
})();
