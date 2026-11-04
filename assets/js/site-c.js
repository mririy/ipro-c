/* Ай Про · версия C — первый экран в духе rocketbank.ru:
   при прокрутке карточка с видео поворачивается, перелив уходит в чёрный, и появляются три шага к зачислению.
   Остальное (окна, альбомы, форма, сцены особняка и ночи) — общий сценарий site.js. */
(function () {
  'use strict';
  var root = document.documentElement;
  var sec = document.getElementById('top'), pin = sec && sec.querySelector('.rhero__pin');
  var mq = matchMedia('(prefers-reduced-motion: reduce)');
  var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
  var ticking = false;
  function upd() {
    ticking = false;
    if (!pin) return;
    var calm = mq.matches || root.classList.contains('a11y');
    var r = sec.getBoundingClientRect(), vh = innerHeight;
    var p = calm ? 0 : clamp(-r.top / Math.max(1, r.height - vh));
    var dk = calm ? 0 : clamp((p - .22) / .22), st = calm ? 0 : clamp((p - .42) / .4);
    pin.style.setProperty('--p', p.toFixed(4));
    pin.style.setProperty('--dk', dk.toFixed(3));
    pin.style.setProperty('--st', st.toFixed(3));
    /* шапка читает тон главы: на чёрном — светлый логотип */
    var tone = dk > .5 ? 'dark' : 'light';
    if (sec.dataset.tone !== tone) { sec.dataset.tone = tone; dispatchEvent(new Event('scroll')); }  /* пусть шапка перекрасится сразу */
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
  addEventListener('resize', upd);
  upd();

  /* кнопка записи внизу экрана прячется у самой формы */
  var sg = document.getElementById('signup');
  if (sg && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { root.classList.toggle('at-signup', es[0].isIntersecting); }, { rootMargin: '0px 0px -35% 0px' }).observe(sg);
  }
})();
