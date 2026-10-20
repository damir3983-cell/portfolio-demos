/* =========================================================
   Кинематографичный движок демо-сайтов.
   Плавная прокрутка (Lenis), заставка, слово-маска, сцены,
   закреплённая «история» по шагам, превью за курсором,
   3D-наклон карточек, параллакс, баннеры внутренних страниц.
   Свои эффекты сайта подключаются через Cine.onScroll(fn).
   ========================================================= */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const body = document.body;
  const isHome = body.classList.contains('page-index');

  // ---------- Утилиты (их же используют скрипты страниц через window.Cine) ----------
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const range = (p, a, b) => clamp((p - a) / (b - a));
  const easeIn = t => t * t * t;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const stickyProgress = el => {
    const r = el.getBoundingClientRect();
    const d = r.height - window.innerHeight;
    return d > 0 ? clamp(-r.top / d) : 0;
  };
  const hooks = [];
  window.Cine = { clamp, lerp, range, easeIn, easeOut, easeInOut, stickyProgress, reduce, onScroll: fn => hooks.push(fn) };

  // Битые фото прячем — остаётся фон блока
  document.querySelectorAll('img').forEach(img => {
    const fail = () => img.classList.add('is-broken');
    if (img.complete && img.naturalWidth === 0 && img.src) fail();
    img.addEventListener('error', fail);
  });

  // ---------- Плавная прокрутка ----------
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({ lerp: 0.09 });

    // Ползунок прокрутки: пока его тянут мышкой, плавную прокрутку выключаем,
    // иначе Lenis тянет страницу к старой точке и анимации сбиваются
    let dragBar = false;
    window.addEventListener('pointerdown', e => {
      if (e.clientX >= document.documentElement.clientWidth) { dragBar = true; lenis.stop(); }
    }, true);
    window.addEventListener('pointerup', () => { if (dragBar) { dragBar = false; lenis.start(); } }, true);
    // клавиши PageUp/Home и т.п. тоже сбрасывают инерцию
    window.addEventListener('keydown', e => { if (['Home','End','PageUp','PageDown'].includes(e.key)) { lenis.stop(); requestAnimationFrame(() => lenis.start()); } });
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -80 }); }
    }));
  }

  // ---------- Прогресс, зерно, курсор ----------
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  body.prepend(bar);
  if (isHome && !reduce) {
    const g = document.createElement('div');
    g.className = 'grain'; g.setAttribute('aria-hidden', 'true');
    body.appendChild(g);
  }
  let cursor = null, cursorLabel = null;
  const mouse = { x: -100, y: -100 }, cur = { x: -100, y: -100 };
  if (hasMouse && !reduce) {
    cursor = document.createElement('div');
    cursor.className = 'cursor is-hidden';
    cursor.innerHTML = '<span></span>';
    cursorLabel = cursor.firstChild;
    body.appendChild(cursor);
    window.addEventListener('mousemove', e => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      const t = e.target.closest('[data-cursor]');
      cursor.classList.toggle('is-big', !!t);
      if (t) cursorLabel.textContent = t.dataset.cursor;
      cursor.classList.remove('is-hidden');
    });
    document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
  }

  // ---------- Заставка: один раз за визит ----------
  if (isHome && !reduce && body.dataset.preloader) {
    const key = 'intro-' + location.pathname.split('/').slice(-2, -1)[0];
    let seen = false;
    try { seen = sessionStorage.getItem(key) === '1'; } catch (e) {}
    if (!seen) {
      const pre = document.createElement('div');
      pre.className = 'preloader';
      pre.innerHTML = '<span class="pre-line"><i></i></span><b>0</b><small></small>';
      pre.querySelector('small').textContent = body.dataset.preloader;
      body.appendChild(pre);
      if (lenis) lenis.stop();
      const num = pre.querySelector('b'), line = pre.querySelector('i'), t0 = performance.now(), dur = 1300;
      (function tick(t) {
        const k = Math.min(1, (t - t0) / dur), v = easeOut(k);
        num.textContent = Math.round(v * 100);
        line.style.transform = `scaleX(${v.toFixed(3)})`;
        if (k < 1) return requestAnimationFrame(tick);
        pre.classList.add('is-done');
        if (lenis) lenis.start();
        setTimeout(() => pre.remove(), 1100);
        try { sessionStorage.setItem(key, '1'); } catch (e) {}
      })(t0);
    }
  }

  // ---------- Появление при прокрутке ----------
  const reveals = [...document.querySelectorAll('[data-reveal]')];
  reveals.forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.hasAttribute('data-reveal'));
    el.style.setProperty('--d', (Math.min(sibs.indexOf(el), 6) * 0.08).toFixed(2) + 's');
  });
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
  } else reveals.forEach(el => el.classList.add('is-in'));

  // ---------- 1. Интро: слово-маска ----------
  const intro = document.getElementById('intro');
  const introStage = document.getElementById('introStage');
  const introMask = document.getElementById('introMask');
  const introTitle = intro ? intro.querySelector('.split-title') : null;
  const introCount = intro ? intro.querySelector('[data-intro-count]') : null;
  function fitMask() {
    if (!introMask) return;
    const portrait = window.innerWidth / window.innerHeight < 1;
    introMask.setAttribute('viewBox', portrait ? '140 160 1320 800' : '0 0 1600 900');
  }

  // Слово-маску увеличиваем атрибутом transform внутри SVG, а не CSS-трансформацией:
  // так браузер каждый кадр перерисовывает буквы как вектор, и после резкого
  // прыжка по странице они не остаются «размазанной картинкой»
  const maskText = introMask ? introMask.querySelector('mask text') : null;
  function setMaskScale(k) {
    if (!maskText) return;
    const vb = introMask.viewBox.baseVal;
    const ox = vb.x + vb.width * 0.5, oy = vb.y + vb.height * 0.54;
    maskText.setAttribute('transform', `translate(${ox} ${oy}) scale(${k.toFixed(3)}) translate(${-ox} ${-oy})`);
  }
  fitMask();
  window.addEventListener('resize', () => { fitMask(); dirty = true; });

  function updateIntro() {
    if (!intro || reduce) return;
    const p = stickyProgress(intro);
    const s = introStage.style;
    // 0–48%: камера «влетает» в букву — сначала медленно, потом рывком
    const z = range(p, 0, 0.48);
    setMaskScale(1 + easeIn(z) * 42);
    s.setProperty('--mask-o', (1 - range(p, 0.36, 0.48)).toFixed(3));
    s.setProperty('--img-s', lerp(1.35, 1.02, easeInOut(z)).toFixed(4));
    s.setProperty('--kick', (1 - range(p, 0, 0.08)).toFixed(3));
    // 50–70%: проявляется заголовок и кнопки
    const c = range(p, 0.5, 0.68);
    s.setProperty('--content', c.toFixed(3));
    s.setProperty('--content-y', lerp(60, 0, easeOut(c)).toFixed(1) + 'px');
    s.setProperty('--shade', lerp(0.35, 1, range(p, 0.45, 0.65)).toFixed(3));
    s.setProperty('--line', range(p, 0.52, 0.95).toFixed(4));
    introStage.classList.toggle('is-content', c > 0.6);
    if (introTitle) introTitle.style.setProperty('--ln-y', c > 0.05 ? '0%' : '105%');
    if (introCount) {
      const to = parseFloat(introCount.dataset.introCount);
      const dec = (introCount.dataset.introCount.split('.')[1] || '').length;
      introCount.textContent = (to * easeOut(range(p, 0.52, 0.9))).toLocaleString('ru-RU', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    }
  }

  // ---------- 2. Сцены ----------
  const scenes = [...document.querySelectorAll('[data-scene]')].map(el => ({ el, stage: el.querySelector('.scene-stage') }));
  function updateScenes() {
    if (reduce) return;
    const vh = window.innerHeight, vw = window.innerWidth, mobile = vw <= 860;
    scenes.forEach(({ el, stage }) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      const p = stickyProgress(el);
      const enter = clamp(1 - r.top / vh);
      const s = stage.style;
      const open = easeInOut(clamp(enter * 0.35 + range(p, 0, 0.32) * 0.65));
      s.setProperty('--ct', lerp(mobile ? 22 : 18, 0, open).toFixed(2) + '%');
      s.setProperty('--cs', lerp(mobile ? 8 : 26, 0, open).toFixed(2) + '%');
      s.setProperty('--cr', lerp(28, 0, open).toFixed(1) + 'px');
      s.setProperty('--img', lerp(1.35, 1.04, open).toFixed(4));
      s.setProperty('--shade', range(p, 0.18, 0.4).toFixed(3));
      s.setProperty('--title-x', lerp(vw * 0.9, -vw * 1.6, clamp(enter * 0.25 + p * 0.75)).toFixed(1) + 'px');
      const info = range(p, 0.28, 0.42) * (1 - range(p, 0.88, 1));
      s.setProperty('--info', info.toFixed(3));
      s.setProperty('--info-y', lerp(40, 0, easeOut(range(p, 0.28, 0.46))).toFixed(1) + 'px');
      s.setProperty('--fa', lerp(vh * 1.1, -vh * 0.6, range(p, 0.2, 1)).toFixed(1) + 'px');
      s.setProperty('--fb', lerp(vh * 1.5, -vh * 0.5, range(p, 0.3, 1)).toFixed(1) + 'px');
    });
  }

  // ---------- 3. История по шагам ----------
  // <section class="story" id="story"> с шагами li, фото .story-bg img и счётчиком [data-story-num]
  // data-keys="1,42,49,75" — значения счётчика в начале каждого шага (между ними — плавно)
  // data-format="time" — показывать как часы (15.5 → 15:30, 33 → 09:00)
  const story = document.getElementById('story');
  const steps = story ? [...story.querySelectorAll('.story-steps li')] : [];
  const storyImgs = story ? [...story.querySelectorAll('.story-bg img')] : [];
  const storyNum = story ? story.querySelector('[data-story-num]') : null;
  const storyBar = story ? story.querySelector('.story-bar span') : null;
  let storyStep = -1;
  const fmt = (v, kind) => {
    if (kind === 'time') {
      const h = Math.floor(v) % 24, m = Math.floor((v % 1) * 60 / 5) * 5;
      return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }
    return Math.round(v).toLocaleString('ru-RU');
  };
  function updateStory() {
    if (!story) return;
    const p = reduce ? 0 : stickyProgress(story);
    const n = steps.length;
    const i = Math.min(n - 1, Math.floor(p * n * 1.02));
    if (storyBar) storyBar.style.transform = `scaleX(${p.toFixed(4)})`;
    if (storyNum) {
      const keys = (storyNum.dataset.keys || '').split(',').map(Number);
      if (keys.length === n) {
        const local = clamp(p * n - i);
        const to = i < n - 1 ? keys[i + 1] : (storyNum.dataset.end ? Number(storyNum.dataset.end) : keys[i]);
        storyNum.textContent = fmt(lerp(keys[i], to, local), storyNum.dataset.format);
      } else storyNum.textContent = String(i + 1).padStart(2, '0');
    }
    if (i === storyStep) return;
    storyStep = i;
    story.dataset.step = i;
    steps.forEach((li, k) => { li.classList.toggle('is-on', k === i); li.classList.toggle('is-past', k < i); });
    storyImgs.forEach((img, k) => img.classList.toggle('is-on', k === i));
  }

  // ---------- Превью за курсором ----------
  let preview = null, previewImg = null;
  const pv = { cx: 0, cy: 0, on: false };
  const previewRows = [...document.querySelectorAll('[data-preview]')];
  if (previewRows.length && hasMouse && !reduce) {
    preview = document.createElement('div');
    preview.className = 'hover-preview';
    preview.innerHTML = '<img alt="">';
    previewImg = preview.firstChild;
    body.appendChild(preview);
    previewRows.forEach(row => {
      row.addEventListener('mouseenter', () => { previewImg.src = row.dataset.preview; pv.on = true; preview.classList.add('is-on'); });
      row.addEventListener('mouseleave', () => { pv.on = false; preview.classList.remove('is-on'); });
    });
  }
  function updatePreview() {
    if (!preview) return;
    pv.cx = lerp(pv.cx, mouse.x + 40, 0.15);
    pv.cy = lerp(pv.cy, mouse.y, 0.15);
    const tilt = clamp((mouse.x + 40 - pv.cx) * 0.1, -12, 12);
    preview.style.transform = `translate3d(${pv.cx.toFixed(1)}px,${pv.cy.toFixed(1)}px,0) translateY(-50%) rotate(${tilt.toFixed(2)}deg) scale(${pv.on ? 1 : 0.6})`;
  }

  // ---------- 3D-наклон карточек ----------
  if (hasMouse && !reduce) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `rotateY(${(x * 14).toFixed(2)}deg) rotateX(${(-y * 14).toFixed(2)}deg)`;
        card.style.transitionDuration = '.1s';
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; card.style.transitionDuration = ''; });
    });
  }

  // ---------- Параллакс и баннеры ----------
  const parallax = [...document.querySelectorAll('[data-parallax]')];
  const banners = [...document.querySelectorAll('[data-scale]')];
  function updateParallax() {
    if (reduce) return;
    const vh = window.innerHeight;
    parallax.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      const off = r.top + r.height / 2 - vh / 2;
      el.style.transform = `translate3d(0,${(off * -Number(el.dataset.parallax)).toFixed(1)}px,0)`;
    });
    banners.forEach(img => {
      const box = img.parentElement, r = box.getBoundingClientRect();
      const p = clamp(-r.top / (r.height + vh * 0.2));
      box.style.setProperty('--bs', lerp(1.12, 1.3, p).toFixed(4));
    });
  }
  // баннер при загрузке раскрывается из узкой полосы
  banners.forEach(img => {
    if (reduce) return;
    const box = img.parentElement;
    box.style.setProperty('--bc', '18%');
    box.style.transition = 'clip-path 1.3s cubic-bezier(.7,0,.2,1)';
    requestAnimationFrame(() => setTimeout(() => box.style.setProperty('--bc', '0%'), 150));
  });

  // ---------- Шапка ----------
  const header = document.querySelector('.site-header');
  let lastY = window.scrollY;
  function updateHeader(y) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? (y / max).toFixed(4) : 0})`;
    if (!header || body.classList.contains('menu-open')) return;
    header.classList.toggle('is-scrolled', y > 24);
    if (y > lastY + 3 && y > 300) header.classList.add('is-hidden');
    else if (y < lastY - 3) header.classList.remove('is-hidden');
  }
  function updateCursor() {
    if (!cursor) return;
    cur.x = lerp(cur.x, mouse.x, 0.2);
    cur.y = lerp(cur.y, mouse.y, 0.2);
    cursor.style.transform = `translate3d(${cur.x.toFixed(1)}px,${cur.y.toFixed(1)}px,0)`;
  }

  // ---------- Главный цикл ----------
  let prevY = -1, prevT = performance.now(), dirty = true;
  window.addEventListener('resize', () => { dirty = true; });
  window.addEventListener('load', () => { dirty = true; });
  function loop(t) {
    if (lenis) lenis.raf(t);
    const dt = Math.min(64, t - prevT); prevT = t;
    const y = window.scrollY;
    if (y !== prevY || dirty) {
      updateHeader(y);
      updateIntro();
      updateScenes();
      updateStory();
      updateParallax();
      hooks.forEach(fn => fn(y, false));
      lastY = prevY; prevY = y; dirty = false;
    }
    hooks.forEach(fn => fn(y, true, dt)); // покадровые эффекты (звёзды, огоньки)
    updatePreview();
    updateCursor();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ---------- Фильтры: карточки «въезжают» заново ----------
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-filter] [data-value],[data-filter-reset],[data-refilter]')) return;
    setTimeout(() => {
      document.querySelectorAll('[data-filter-list] > :not([hidden])').forEach((s, i) => {
        s.classList.remove('is-in-anim'); void s.offsetWidth;
        s.style.animationDelay = (i * 0.05) + 's';
        s.classList.add('is-in-anim');
      });
    }, 0);
  });
})();
