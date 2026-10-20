/* =========================================================
   «Пульс» — кинематографичные анимации.
   Плавная прокрутка (Lenis), заставка, слово-маска, сцены зон,
   пульс тренировки, превью занятий, 3D-наклон карточек тренеров.
   ========================================================= */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isHome = document.body.classList.contains('page-index');

  // ---------- Утилиты ----------
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

  // Битые фото прячем — остаётся тёмный фон блока
  document.querySelectorAll('img').forEach(img => {
    const fail = () => img.classList.add('is-broken');
    if (img.complete && img.naturalWidth === 0 && img.src) fail();
    img.addEventListener('error', fail);
  });

  // ---------- Плавная прокрутка с инерцией ----------
  // Lenis подключается с CDN. Нет интернета — сайт просто листается обычным способом.
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 1 });

    // Ползунок прокрутки: пока его тянут мышкой, плавную прокрутку выключаем,
    // иначе Lenis тянет страницу к старой точке и анимации сбиваются
    let dragBar = false;
    window.addEventListener('pointerdown', e => {
      if (e.clientX >= document.documentElement.clientWidth) { dragBar = true; lenis.stop(); }
    }, true);
    window.addEventListener('pointerup', () => { if (dragBar) { dragBar = false; lenis.start(); } }, true);
    // клавиши PageUp/Home и т.п. тоже сбрасывают инерцию
    window.addEventListener('keydown', e => { if (['Home','End','PageUp','PageDown'].includes(e.key)) { lenis.stop(); requestAnimationFrame(() => lenis.start()); } });
    // якорные ссылки тоже плавно
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -80 }); }
    }));
  }

  // ---------- Служебные слои: прогресс, зерно, курсор ----------
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.prepend(bar);
  if (isHome && !reduce) {
    const g = document.createElement('div');
    g.className = 'grain'; g.setAttribute('aria-hidden', 'true');
    document.body.appendChild(g);
  }
  let cursor = null, cursorLabel = null;
  const mouse = { x: -100, y: -100 }, cur = { x: -100, y: -100 };
  if (hasMouse && !reduce) {
    cursor = document.createElement('div');
    cursor.className = 'cursor is-hidden';
    cursor.innerHTML = '<span></span>';
    cursorLabel = cursor.firstChild;
    document.body.appendChild(cursor);
    window.addEventListener('mousemove', e => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      const t = e.target.closest('[data-cursor]');
      cursor.classList.toggle('is-big', !!t);
      if (t) cursorLabel.textContent = t.dataset.cursor;
      cursor.classList.remove('is-hidden');
    });
    document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
  }

  // ---------- Заставка (только главная, один раз за визит) ----------
  if (isHome && !reduce) {
    let seen = false;
    try { seen = sessionStorage.getItem('puls-intro') === '1'; } catch (e) {}
    if (!seen) {
      const pre = document.createElement('div');
      pre.className = 'preloader';
      pre.innerHTML = '<svg viewBox="0 0 420 80" preserveAspectRatio="none"><path pathLength="1" d="M0 40 H120 L135 40 L145 25 L155 40 H190 L202 40 L212 4 L226 76 L236 40 H300 L312 30 L326 40 H420"/></svg><b>0</b><small>Пульс · фитнес-клуб 24/7</small>';
      document.body.appendChild(pre);
      if (lenis) lenis.stop();
      const num = pre.querySelector('b'), t0 = performance.now(), dur = 1300;
      (function tick(t) {
        const k = Math.min(1, (t - t0) / dur);
        num.textContent = Math.round(easeOut(k) * 100);
        if (k < 1) return requestAnimationFrame(tick);
        pre.classList.add('is-done');
        if (lenis) lenis.start();
        setTimeout(() => pre.remove(), 1100);
        try { sessionStorage.setItem('puls-intro', '1'); } catch (e) {}
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
  const introBpm = document.getElementById('introBpm');
  const introTitle = intro ? intro.querySelector('.split-title') : null;

  // На вертикальном экране «приближаем» слово, чтобы оно было во всю ширину
  const introMask = document.getElementById('introMask');
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
    // 0–48%: камера «влетает» в букву. Степень 3 — сначала медленно, потом рывком, как в трейлере
    const z = range(p, 0, 0.48);
    setMaskScale(1 + easeIn(z) * 42);
    s.setProperty('--mask-o', (1 - range(p, 0.36, 0.48)).toFixed(3));
    s.setProperty('--img-s', lerp(1.35, 1.02, easeInOut(z)).toFixed(4));
    s.setProperty('--kick', (1 - range(p, 0, 0.08)).toFixed(3));
    // 50–75%: проявляется текст, рисуется кардиограмма, пульс разгоняется
    const c = range(p, 0.5, 0.68);
    s.setProperty('--content', c.toFixed(3));
    s.setProperty('--content-y', lerp(60, 0, easeOut(c)).toFixed(1) + 'px');
    s.setProperty('--shade', lerp(0.35, 1, range(p, 0.45, 0.65)).toFixed(3));
    const e = range(p, 0.52, 0.95);
    s.setProperty('--ecg', e.toFixed(4));
    if (introBpm) introBpm.textContent = Math.round(72 + e * 96);
    introStage.classList.toggle('is-content', c > 0.6);
    if (introTitle) introTitle.style.setProperty('--ln-y', c > 0.05 ? '0%' : '105%');
  }

  // ---------- 2. Сцены зон ----------
  const scenes = [...document.querySelectorAll('[data-scene]')].map(el => ({ el, stage: el.querySelector('.scene-stage') }));
  function updateScenes() {
    if (reduce) return;
    const vh = window.innerHeight, vw = window.innerWidth, mobile = vw <= 860;
    scenes.forEach(({ el, stage }) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return; // сцена далеко — не считаем
      const p = stickyProgress(el);
      // «вход» ещё до закрепления: пока сцена въезжает снизу, окно уже начинает расти
      const enter = clamp(1 - r.top / vh);
      const s = stage.style;
      const open = easeInOut(clamp(enter * 0.35 + range(p, 0, 0.32) * 0.65));
      s.setProperty('--ct', lerp(mobile ? 22 : 18, 0, open).toFixed(2) + '%');
      s.setProperty('--cs', lerp(mobile ? 8 : 26, 0, open).toFixed(2) + '%');
      s.setProperty('--cr', lerp(28, 0, open).toFixed(1) + 'px');
      s.setProperty('--img', lerp(1.35, 1.04, open).toFixed(4));
      s.setProperty('--shade', range(p, 0.18, 0.4).toFixed(3));
      // огромное название едет через кадр справа налево
      s.setProperty('--title-x', lerp(vw * 0.9, -vw * 1.6, clamp(enter * 0.25 + p * 0.75)).toFixed(1) + 'px');
      // описание: появляется на 30%, уходит на 88%
      const info = range(p, 0.28, 0.42) * (1 - range(p, 0.88, 1));
      s.setProperty('--info', info.toFixed(3));
      s.setProperty('--info-y', lerp(40, 0, easeOut(range(p, 0.28, 0.46))).toFixed(1) + 'px');
      // маленькие кадры пролетают снизу вверх с разной скоростью
      s.setProperty('--fa', lerp(vh * 1.1, -vh * 0.6, range(p, 0.2, 1)).toFixed(1) + 'px');
      s.setProperty('--fb', lerp(vh * 1.5, -vh * 0.5, range(p, 0.3, 1)).toFixed(1) + 'px');
    });
  }

  // ---------- 3. Пульс тренировки ----------
  const pulse = document.getElementById('pulse');
  const pulseBpm = document.getElementById('pulseBpm');
  const pulseMin = document.getElementById('pulseMin');
  const pulsePath = document.getElementById('pulsePath');
  const phases = pulse ? [...pulse.querySelectorAll('.pulse-phases li')] : [];
  const pulseImgs = pulse ? [...pulse.querySelectorAll('.pulse-bg img')] : [];
  // Пульс по минутам тренировки: разминка → сила → пик табаты → заминка
  const curve = [[0, 72], [10, 110], [22, 128], [35, 138], [40, 165], [45, 168], [50, 118], [55, 96]];
  const bpmAt = m => {
    for (let i = 1; i < curve.length; i++) {
      if (m <= curve[i][0]) {
        const [m0, b0] = curve[i - 1], [m1, b1] = curve[i];
        return lerp(b0, b1, (m - m0) / (m1 - m0));
      }
    }
    return 96;
  };
  let pulseState = { bpm: 72, phase: -1 }, ecgShift = 0;

  function updatePulse() {
    if (!pulse) return;
    const p = reduce ? 0.8 : stickyProgress(pulse);
    const min = p * 55;
    const bpm = bpmAt(min);
    pulseState.bpm = bpm;
    pulseBpm.textContent = Math.round(bpm);
    pulseMin.textContent = Math.round(min);
    pulse.classList.toggle('is-peak', bpm > 155);
    const ph = min < 10 ? 0 : min < 35 ? 1 : min < 45 ? 2 : 3;
    if (ph !== pulseState.phase) {
      pulseState.phase = ph;
      phases.forEach((li, i) => li.classList.toggle('is-on', i === ph));
      pulseImgs.forEach((img, i) => img.classList.toggle('is-on', i === ph));
    }
  }

  // Кардиограмма бежит постоянно; частота и высота ударов зависят от пульса
  function drawEcg(dt) {
    if (!pulsePath) return;
    const r = pulse.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    const bpm = pulseState.bpm;
    const beatW = 1200 / (bpm / 9);           // чем выше пульс, тем чаще удары
    const amp = 40 + (bpm - 72) * 0.75;       // и тем они выше
    ecgShift = (ecgShift + dt * 0.06 * (bpm / 72)) % beatW;
    let d = 'M0 100', x = -ecgShift;
    while (x < 1200 + beatW) {
      const b = x;
      d += ` L${(b + beatW * 0.30).toFixed(1)} 100 L${(b + beatW * 0.36).toFixed(1)} ${(100 - amp * 0.15).toFixed(1)} L${(b + beatW * 0.42).toFixed(1)} 100`
        + ` L${(b + beatW * 0.48).toFixed(1)} 100 L${(b + beatW * 0.52).toFixed(1)} ${(100 - amp).toFixed(1)} L${(b + beatW * 0.57).toFixed(1)} ${(100 + amp * 0.7).toFixed(1)}`
        + ` L${(b + beatW * 0.61).toFixed(1)} 100 L${(b + beatW * 0.72).toFixed(1)} 100 L${(b + beatW * 0.79).toFixed(1)} ${(100 - amp * 0.22).toFixed(1)} L${(b + beatW * 0.86).toFixed(1)} 100`;
      x += beatW;
    }
    pulsePath.setAttribute('d', d + ' L1200 100');
  }

  // ---------- Превью занятия за курсором ----------
  let preview = null, previewImg = null;
  const pv = { x: 0, y: 0, cx: 0, cy: 0, on: false };
  const previewRows = [...document.querySelectorAll('[data-preview]')];
  if (previewRows.length && hasMouse && !reduce) {
    preview = document.createElement('div');
    preview.className = 'slot-preview';
    preview.innerHTML = '<img alt="">';
    previewImg = preview.firstChild;
    document.body.appendChild(preview);
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
    preview.style.transform = `translate3d(${pv.cx.toFixed(1)}px,${pv.cy.toFixed(1)}px,0) translate(-0%,-50%) rotate(${tilt.toFixed(2)}deg) scale(${pv.on ? 1 : 0.6})`;
  }

  // ---------- 3D-наклон карточек тренеров ----------
  if (hasMouse && !reduce) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `rotateY(${(x * 14).toFixed(2)}deg) rotateX(${(-y * 14).toFixed(2)}deg) translateZ(0)`;
        card.style.transitionDuration = '.1s';
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; card.style.transitionDuration = ''; });
      card.dataset.cursor = card.dataset.cursor || 'Знакомьтесь';
    });
  }

  // ---------- Параллакс и баннеры внутренних страниц ----------
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
    // баннер: при загрузке раскрывается из узкой полосы, при прокрутке фото «отъезжает»
    banners.forEach(img => {
      const box = img.parentElement, r = box.getBoundingClientRect();
      const p = clamp(-r.top / (r.height + vh * 0.2));
      box.style.setProperty('--bs', lerp(1.12, 1.3, p).toFixed(4));
    });
  }
  banners.forEach(img => {
    const box = img.parentElement;
    if (reduce) return;
    box.style.setProperty('--bc', '18%');
    box.style.transition = 'clip-path 1.3s cubic-bezier(.7,0,.2,1)';
    requestAnimationFrame(() => setTimeout(() => box.style.setProperty('--bc', '0%'), 150));
  });

  // ---------- Шапка: прячется вниз, появляется вверх ----------
  const header = document.querySelector('.site-header');
  let lastY = window.scrollY;
  function updateHeader(y) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? (y / max).toFixed(4) : 0})`;
    if (!header || document.body.classList.contains('menu-open')) return;
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
  function loop(t) {
    if (lenis) lenis.raf(t);
    const dt = Math.min(64, t - prevT); prevT = t;
    const y = window.scrollY;
    if (y !== prevY || dirty) {
      updateHeader(y);
      updateIntro();
      updateScenes();
      updatePulse();
      updateParallax();
      lastY = prevY; prevY = y; dirty = false;
    }
    if (!reduce) drawEcg(dt); else if (pulsePath && !pulsePath.getAttribute('d')) drawEcg(0);
    updatePreview();
    updateCursor();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ---------- Расписание: строки «въезжают» при смене фильтра ----------
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-day-btn],[data-dir-btn],#resetDir,[data-filter] [data-value],[data-filter-reset]')) return;
    setTimeout(() => {
      document.querySelectorAll('#slots .slot:not([hidden]), .trainer-list .trainer-row:not([hidden])').forEach((s, i) => {
        s.classList.remove('is-in-anim'); void s.offsetWidth;
        s.style.animationDelay = (i * 0.05) + 's';
        s.classList.add('is-in-anim');
      });
    }, 0);
  });
})();
