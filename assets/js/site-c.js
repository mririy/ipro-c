/* Ай Про · версия C — первый экран из двух частей:
   1) как в версии A (site.js): видео в круге-солнце раскрывается во весь экран, солнце улетает в логотип;
   2) как у rocketbank.ru: видео сжимается в стеклянную карточку и уходит вниз, на чёрном появляются три шага к зачислению.
   site.js на каждом кадре зовёт window.iproHeroB(q), где q — доля второй части (0…1), или -1 — сбросить всё.
   Остальное (окна, альбомы, форма, сцены особняка и ночи) — общий сценарий site.js. */
(function () {
  'use strict';
  var root = document.documentElement;
  /* для проверки полос Safari: ?nohd — без шапки, ?nocta — без кнопки записи (страница bars/) */
  if (/[?&]nohd\b/.test(location.search)) root.classList.add('t-nohd');
  if (/[?&]nocta\b/.test(location.search)) root.classList.add('t-nocta');
  var pin = document.querySelector('.hero .rhero__pin'), slot = pin && pin.querySelector('.rhero__slot');
  var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  /* пока первый экран не пролистан, кнопки записи внизу нет (без движения она видна сразу) */
  if (pin && scrollY < pin.parentNode.offsetHeight * .9 && !matchMedia('(prefers-reduced-motion: reduce)').matches && !root.classList.contains('a11y')) root.classList.add('cta-wait');
  var box = null, VARS = ['--wl', '--wt', '--ww', '--wh', '--wrot', '--wr', '--vs', '--fw', '--fh', '--t', '--tb', '--st'];

  function measure() {  /* размер сцены и место карточки (по невидимой разметке, учитывает все размеры экранов) */
    box = { W: pin.clientWidth, H: pin.clientHeight, x: slot.offsetLeft, y: slot.offsetTop, w: slot.offsetWidth, h: slot.offsetHeight, wide: innerWidth >= 900 };
  }
  addEventListener('resize', function () { box = null; });

  var last = -2;
  window.iproHeroB = function (q) {
    if (!pin || !slot) return;
    if (q < 0) { VARS.forEach(function (v) { pin.style.removeProperty(v); }); pin.classList.remove('is-card'); root.classList.remove('cta-wait'); last = -2; return; }
    root.classList.toggle('cta-wait', q < .96);  /* кнопка записи — только когда анимация первого экрана пройдена */
    if (!box) { measure(); last = -2; }
    if (Math.abs(q - last) < .0002) return;
    last = q;
    var b = box, s = pin.style;
    var t = ease(seg(q, 0, .45)),          /* видео сжимается в карточку */
        st = seg(q, .4, .92),              /* шаги появляются по одному, карточка уходит вниз */
        tb = seg(q, 0, .22);               /* фраза первого экрана гаснет */
    var k = b.wide ? .08 : .28, drift = b.wide ? 0 : b.H * .1;
    var cw = b.w * (1 - st * k), ch = b.h * (1 - st * k), cx = b.x, cy = b.y + st * drift;
    var w = lerp(b.W, cw, t), h = lerp(b.H, ch, t), x = lerp(b.W / 2, cx, t), y = lerp(b.H / 2, cy, t);
    var rot = lerp(0, b.wide ? 7 : 6, t) - st * 9;
    s.setProperty('--wl', (x - w / 2).toFixed(1) + 'px');
    s.setProperty('--wt', (y - h / 2).toFixed(1) + 'px');
    s.setProperty('--ww', w.toFixed(1) + 'px');
    s.setProperty('--wh', h.toFixed(1) + 'px');
    s.setProperty('--wrot', rot.toFixed(2) + 'deg');
    s.setProperty('--wr', (30 * t).toFixed(1) + 'px');
    s.setProperty('--fw', b.W + 'px');
    s.setProperty('--fh', b.H + 'px');
    s.setProperty('--vs', Math.max(w / b.W, h / b.H).toFixed(4));
    s.setProperty('--t', t.toFixed(3));
    s.setProperty('--tb', tb.toFixed(3));
    s.setProperty('--st', st.toFixed(3));
    pin.classList.toggle('is-card', t > .001);
  };

  /* видео: если телефон не запустил его сам (режим энергосбережения), запускаем при первом касании или прокрутке */
  var v = document.querySelector('.hero__win video');
  if (v) {
    var kickV = function () { if (v.paused) { v.muted = true; var r = v.play(); if (r && r.catch) r.catch(function () {}); } };
    ['touchstart', 'scroll', 'click'].forEach(function (ev) { addEventListener(ev, kickV, { passive: true, once: true }); });
    v.addEventListener('canplay', kickV);
  }

  /* фон страницы синий, пока на экране первый экран (Safari на iPhone берёт его для полос браузера в самом начале) */
  var topSec = document.getElementById('top'), atTop = null;
  function markTop() { var on = !!topSec && topSec.getBoundingClientRect().bottom > 2; if (on !== atTop) { atTop = on; root.classList.toggle('at-top', on); } }
  addEventListener('scroll', markTop, { passive: true });
  markTop();

  /* iPhone (Safari 26): под полосами браузера не должно оказываться закреплённых элементов — см. site-c.css */
  var iosBars = (window.CSS && CSS.supports && CSS.supports('-webkit-touch-callout', 'none')) || /[?&]ios\b/.test(location.search);
  if (iosBars) {
    root.classList.add('ios-bars');
    /* карточки программ: обычный блок → «липнет», когда подъехала к своему месту → снова обычный блок со сдвигом,
       когда стопка уезжает вверх. Переключения — там, где все три положения совпадают, поэтому без скачков. */
    var cards = [].slice.call(document.querySelectorAll('.stack .lvl')), S = [], st = [], cTick = false;
    var stickyTop = function (c) { var t = c.style.top, had = c.classList.contains('is-stk'); c.style.top = ''; c.classList.add('is-stk'); var v = parseFloat(getComputedStyle(c).top) || 0; if (!had) c.classList.remove('is-stk'); c.style.top = t; return v; };
    cards.forEach(function (c, i) { S[i] = stickyTop(c); st[i] = 'flow'; });
    var calmNow = function () { return root.classList.contains('a11y') || matchMedia('(prefers-reduced-motion: reduce)').matches; };
    function cardsFrame() {
      cTick = false;
      if (calmNow()) return;
      cards.forEach(function (c, i) {
        var top = c.getBoundingClientRect().top, s = S[i];
        if (st[i] === 'flow' && top <= s + 80 && top > s - 400) { c.classList.add('is-stk'); st[i] = 'stk'; }
        else if (st[i] === 'stk' && top > s + 80) { c.classList.remove('is-stk'); st[i] = 'flow'; }
        else if (st[i] === 'stk' && top < s - .5) {
          c.classList.remove('is-stk');
          var nat = c.getBoundingClientRect().top;
          c.style.top = (top - nat).toFixed(1) + 'px'; st[i] = 'after';
        } else if (st[i] === 'after' && top >= s) { c.style.top = ''; c.classList.add('is-stk'); st[i] = 'stk'; }
      });
    }
    var kickCards = function () { if (!cTick) { cTick = true; requestAnimationFrame(cardsFrame); } };
    addEventListener('scroll', kickCards, { passive: true });
    addEventListener('resize', function () { cards.forEach(function (c, i) { c.classList.remove('is-stk'); c.style.top = ''; st[i] = 'flow'; S[i] = stickyTop(c); }); kickCards(); });
    kickCards();

  }

  /* цвет кнопки записи — по главе под ней: на светлой синяя, на тёмной белая */
  var ctaEl = document.querySelector('.ask.dock-cta'), ctaSecs = [].slice.call(document.querySelectorAll('main > .sc')), ctaTick = false, ctaLight = null;
  function toneCta() {
    ctaTick = false;
    if (!ctaEl) return;
    var r = ctaEl.getBoundingClientRect(), y = r.top + r.height / 2, light = false;
    for (var i = ctaSecs.length - 1; i >= 0; i--) { var b = ctaSecs[i].getBoundingClientRect(); if (b.top <= y && b.bottom > y) { light = ctaSecs[i].dataset.tone === 'light'; break; } }
    if (light !== ctaLight) { ctaLight = light; root.classList.toggle('cta-light', light); }
  }
  addEventListener('scroll', function () { if (!ctaTick) { ctaTick = true; requestAnimationFrame(toneCta); } }, { passive: true });
  addEventListener('resize', toneCta);
  toneCta();

  /* кнопка записи внизу экрана прячется у самой формы */
  var sg = document.getElementById('signup');
  if (sg && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { root.classList.toggle('at-signup', es[0].isIntersecting); }, { rootMargin: '0px 0px -35% 0px' }).observe(sg);
  }
})();
