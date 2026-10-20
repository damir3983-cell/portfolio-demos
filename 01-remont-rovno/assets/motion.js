/* =========================================================
   Анимации «Ровно»: первый экран до/после, этапы, лента объектов,
   слова манифеста, бегущая строка, параллакс, курсор.
   Всё считается в одном цикле requestAnimationFrame.
   ========================================================= */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---------- Утилиты ----------
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  // range(p, 0.2, 0.6): 0 при p ≤ 0.2, 1 при p ≥ 0.6, между — плавно
  const range = (p, a, b) => clamp((p - a) / (b - a));
  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  // Прогресс «липкой» секции: 0 — доехала до верха экрана, 1 — досмотрена
  const stickyProgress = el => {
    const r = el.getBoundingClientRect();
    const d = r.height - window.innerHeight;
    return d > 0 ? clamp(-r.top / d) : 0;
  };

  // Если фото не загрузилось — прячем «битую» иконку, остаётся цветной фон
  document.querySelectorAll('img').forEach(img => {
    const fail = () => img.classList.add('is-broken');
    if (img.complete && img.naturalWidth === 0 && img.src) fail();
    img.addEventListener('error', fail);
  });

  // ---------- Полоска прогресса и курсор ----------
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.prepend(bar);

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

  // ---------- Появление элементов ----------
  const reveals = [...document.querySelectorAll('[data-reveal]')];
  // соседние элементы появляются с небольшой задержкой друг за другом
  reveals.forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.hasAttribute('data-reveal'));
    el.style.setProperty('--d', (sibs.indexOf(el) * 0.08).toFixed(2) + 's');
  });
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
  } else reveals.forEach(el => el.classList.add('is-in'));

  // ---------- Сцена 1: до/после ----------
  const hero = document.getElementById('hero');
  const heroStage = document.getElementById('heroStage');
  const heroIntro = document.getElementById('heroIntro');
  const heroDay = document.getElementById('heroDay');
  let introBottom = 0;

  function updateHero() {
    if (!hero || reduce) return;
    const p = stickyProgress(hero);
    const vw = window.innerWidth;
    const vh = heroStage.clientHeight;
    const mobile = vw <= 600;

    // Начальное окно фото: сразу под текстом, по бокам поля
    const startTop = Math.min(introBottom + (mobile ? 16 : 28), vh * 0.74);
    const startSide = mobile ? 16 : vw <= 980 ? vw * 0.05 : vw * 0.16;
    const startBottom = vw <= 860 ? 84 : 28; // на телефоне снизу липкая кнопка

    // 0–38%: окно раскрывается на весь экран
    const z = easeInOut(range(p, 0, 0.38));
    const s = heroStage.style;
    s.setProperty('--ct', lerp(startTop, 0, z) + 'px');
    s.setProperty('--cs', lerp(startSide, 0, z) + 'px');
    s.setProperty('--cb', lerp(startBottom, 0, z) + 'px');
    s.setProperty('--cr', lerp(20, 0, z) + 'px');
    s.setProperty('--img-scale', lerp(1.25, 1, z).toFixed(4));
    // строки заголовка разъезжаются в стороны и тают
    s.setProperty('--shift', (z * vw * 0.6).toFixed(1) + 'px');
    s.setProperty('--intro', (1 - range(p, 0.02, 0.22)).toFixed(3));
    s.setProperty('--hint', (1 - range(p, 0, 0.05)).toFixed(3));

    // 40–74%: лазерная линия идёт слева направо, «до» превращается в «после»
    const w = easeInOut(range(p, 0.4, 0.74));
    s.setProperty('--wipe', (w * 100).toFixed(2) + '%');
    s.setProperty('--laser', w > 0.001 && w < 0.999 ? 1 : 0);
    s.setProperty('--tb', (1 - range(w, 0.55, 0.85)).toFixed(3));
    s.setProperty('--ta', range(w, 0.05, 0.25).toFixed(3));
    if (heroDay) heroDay.textContent = Math.max(1, Math.round(lerp(1, 55, w)));

    // 74–95%: затемнение и финальный текст
    s.setProperty('--shade', range(p, 0.74, 0.9).toFixed(3));
    s.setProperty('--final', range(p, 0.78, 0.92).toFixed(3));
    s.setProperty('--final-y', lerp(48, 0, easeOut(range(p, 0.78, 0.96))).toFixed(1) + 'px');
    // теги прячутся под финальный текст
    if (p > 0.76) { s.setProperty('--ta', (1 - range(p, 0.76, 0.84)).toFixed(3)); }
    heroStage.classList.toggle('is-final', p > 0.85);
  }

  // ---------- Сцена 2: пять этапов ----------
  const stages = document.getElementById('stages');
  const stageItems = stages ? [...stages.querySelectorAll('.stage')] : [];
  const stagePhotos = stages ? [...stages.querySelectorAll('.stage-photos img')] : [];
  const stageBar = document.getElementById('stageBar');
  const stageNum = document.getElementById('stageNum');
  const stageDays = document.getElementById('stageDays');
  const days = ['дни 1–12', 'дни 13–24', 'дни 25–30', 'дни 31–50', 'дни 51–55'];
  let stageNow = -1;

  function updateStages() {
    if (!stages) return;
    const p = reduce ? 1 : stickyProgress(stages);
    if (stageBar) stageBar.style.setProperty('--p', p.toFixed(4));
    const i = Math.min(4, Math.floor(p * 5.2));
    if (i === stageNow) return;
    stageNow = i;
    stages.dataset.stage = i;
    stageItems.forEach((el, k) => el.classList.toggle('is-on', k === i));
    // показываем все фото до текущего: новое выезжает шторкой поверх старого
    stagePhotos.forEach((img, k) => img.classList.toggle('is-on', k <= i));
    if (stageNum) stageNum.textContent = String(i + 1).padStart(2, '0');
    if (stageDays) stageDays.textContent = days[i];
  }

  // ---------- Сцена 3: лента объектов ----------
  const ribbon = document.getElementById('ribbon');
  const track = document.getElementById('ribbonTrack');
  const ribbonNow = document.getElementById('ribbonNow');
  const ribbonBar = document.getElementById('ribbonBar');
  let ribbonDist = 0, ribbonPinned = false;

  function measureRibbon() {
    if (!ribbon || !track) return;
    ribbonPinned = window.innerWidth > 900 && !reduce;
    ribbon.classList.toggle('is-pinned', ribbonPinned);
    if (!ribbonPinned) { ribbon.style.height = ''; track.style.transform = ''; return; }
    ribbonDist = Math.max(0, track.scrollWidth - window.innerWidth);
    // высота секции = экран + длина ленты: столько нужно прокрутить, чтобы увидеть всё
    ribbon.style.height = (window.innerHeight + ribbonDist) + 'px';
  }

  function updateRibbon() {
    if (!ribbonPinned) return;
    const p = stickyProgress(ribbon);
    track.style.transform = `translate3d(${(-p * ribbonDist).toFixed(1)}px,0,0)`;
    if (ribbonBar) ribbonBar.style.transform = `scaleX(${p.toFixed(4)})`;
    if (ribbonNow) ribbonNow.textContent = String(Math.min(5, Math.round(p * 4) + 1)).padStart(2, '0');
    // фото внутри карточек слегка смещаются — эффект глубины
    const c = window.innerWidth / 2;
    track.querySelectorAll('.robj-img img').forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      const off = (r.left + r.width / 2 - c) / window.innerWidth;
      img.style.transform = `translateX(${(off * -36).toFixed(1)}px) scale(1.12)`;
    });
  }

  // ---------- Сцена 4: слова манифеста ----------
  const manifest = document.getElementById('manifest');
  let words = [], lit = -1;
  if (manifest) {
    const keys = ['потолок,', '5%'];
    manifest.innerHTML = manifest.textContent.trim().split(/\s+/)
      .map(w => `<span class="w${keys.includes(w) ? ' is-key' : ''}">${w}</span>`).join(' ');
    words = [...manifest.querySelectorAll('.w')];
  }
  function updateManifest() {
    if (!manifest) return;
    const r = manifest.getBoundingClientRect();
    const p = clamp((window.innerHeight * 0.85 - r.top) / (r.height + window.innerHeight * 0.3));
    const n = reduce ? words.length : Math.floor(p * words.length * 1.15);
    if (n === lit) return;
    lit = n;
    words.forEach((w, i) => w.classList.toggle('is-on', i < n));
  }

  // ---------- Параллакс и «приближение» фото ----------
  const parallax = [...document.querySelectorAll('[data-parallax]')];
  const scaleIns = [...document.querySelectorAll('[data-scale]')];
  function updateParallax() {
    if (reduce) return;
    const k = window.innerWidth <= 600 ? 0.5 : 1;
    parallax.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      const off = r.top + r.height / 2 - window.innerHeight / 2;
      el.style.transform = `translate3d(0,${(off * -Number(el.dataset.parallax) * k).toFixed(1)}px,0)`;
    });
    // баннер: фото «отъезжает» от 1.2 до 1 по мере прокрутки
    scaleIns.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      const p = clamp(1 - (r.top + r.height * 0.3) / window.innerHeight);
      const start = window.scrollY < 10 ? 0 : p;
      el.style.setProperty('--bs', lerp(1.2, 1, easeOut(clamp(start + 0.25))).toFixed(4));
    });
  }

  // ---------- Бегущая строка: ускоряется и наклоняется от скорости ----------
  const marquee = document.getElementById('marquee');
  let mx = 0, skew = 0, dir = 1, velocity = 0;
  if (marquee) marquee.innerHTML += marquee.innerHTML; // дублируем — лента бесконечная
  function updateMarquee() {
    if (!marquee || reduce) return;
    if (Math.abs(velocity) > 0.5) dir = velocity > 0 ? 1 : -1;
    mx -= (0.7 + Math.abs(velocity) * 0.35) * dir;
    const half = marquee.scrollWidth / 2;
    if (mx <= -half) mx += half;
    if (mx > 0) mx -= half;
    skew = lerp(skew, clamp(velocity * -0.3, -12, 12), 0.1);
    marquee.style.transform = `translate3d(${mx.toFixed(1)}px,0,0) skewX(${skew.toFixed(2)}deg)`;
  }

  // ---------- Шапка: прячется при прокрутке вниз ----------
  const header = document.querySelector('.site-header');
  let lastY = window.scrollY;
  function updateHeader(y) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? (y / max).toFixed(4) : 0})`;
    if (!header || document.body.classList.contains('menu-open')) return;
    if (y > lastY + 4 && y > 300) header.classList.add('is-hidden');
    else if (y < lastY - 4) header.classList.remove('is-hidden');
  }

  // ---------- Курсор догоняет мышь ----------
  function updateCursor() {
    if (!cursor) return;
    cur.x = lerp(cur.x, mouse.x, 0.2);
    cur.y = lerp(cur.y, mouse.y, 0.2);
    cursor.style.transform = `translate3d(${cur.x.toFixed(1)}px,${cur.y.toFixed(1)}px,0)`;
  }

  // ---------- Размеры и главный цикл ----------
  let dirty = true;
  function measure() {
    if (heroIntro) introBottom = heroIntro.offsetTop + heroIntro.offsetHeight;
    measureRibbon();
    dirty = true;
  }
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  if (document.fonts) document.fonts.ready.then(measure);
  measure();

  let prevY = -1;
  function loop() {
    const y = window.scrollY;
    velocity = lerp(velocity, y - lastY, 0.2);
    if (y !== prevY || dirty) {
      updateHeader(y);
      updateHero();
      updateStages();
      updateRibbon();
      updateManifest();
      updateParallax();
      prevY = y; dirty = false;
    }
    lastY = y;
    updateMarquee();
    updateCursor();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ---------- Объекты: показать план на телефоне ----------
  document.querySelectorAll('.obj-plan-btn').forEach(b => b.addEventListener('click', e => {
    e.preventDefault();
    const m = b.closest('.obj-media');
    const on = !m.classList.contains('show-plan');
    m.classList.toggle('show-plan', on);
    b.setAttribute('aria-pressed', String(on));
    b.textContent = on ? 'Фото' : 'План';
  }));
  // Фильтр объектов: карточки «всплывают» при переключении
  document.querySelectorAll('[data-filter] [data-value], [data-filter-reset]').forEach(b => b.addEventListener('click', () => setTimeout(() => {
    document.querySelectorAll('.objs .obj:not([hidden])').forEach((o, i) => {
      o.classList.remove('is-filtering'); void o.offsetWidth;
      o.style.animationDelay = (i * 0.05) + 's';
      o.classList.add('is-filtering');
    });
  })));
})();
