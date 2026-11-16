(function () {
  var muted = true;
  var vids = [].slice.call(document.querySelectorAll('video[data-src]'));
  function play(v) { if (!v.src) v.src = v.dataset.src; v.muted = muted; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) play(e.target); else e.target.pause(); });
    }, { threshold: 0.6 });
    vids.forEach(function (v) { io.observe(v); });
  } else { vids.forEach(play); }
  [].forEach.call(document.querySelectorAll('.slides'), function (s) {
    var c = s.parentNode.querySelector('.cnt'); if (!c) return;
    var n = s.dataset.count;
    s.addEventListener('scroll', function () {
      var i = Math.round(Math.abs(s.scrollLeft) / s.clientWidth) + 1; c.textContent = i + ' / ' + n;
    }, { passive: true });
  });
  var fp = document.querySelector('.fp');
  if (fp) {
    var feed = fp.querySelector('.feed'), count = fp.querySelector('.count'), n = fp.dataset.count;
    feed.addEventListener('scroll', function () {
      var i = Math.round(feed.scrollTop / feed.clientHeight) + 1; count.textContent = i + ' / ' + n; fp.classList.add('scrolled');
    }, { passive: true });
    var btn = fp.querySelector('.mute');
    if (btn) btn.addEventListener('click', function () {
      muted = !muted;
      btn.setAttribute('aria-pressed', String(muted));
      btn.setAttribute('aria-label', muted ? fp.dataset.unmute : fp.dataset.mute);
      vids.forEach(function (v) { v.muted = muted; });
    });
  }
})();
