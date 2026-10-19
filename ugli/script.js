// =========================================================
// 0. УТИЛИТЫ
// =========================================================
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;
// Кусок прогресса: range(p, 0.2, 0.6) → 0 до 0.2, плавно растёт, 1 после 0.6
const range = (p, start, end) => clamp((p - start) / (end - start));
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const formatPrice = n => n.toLocaleString('ru-RU') + ' ₽';
const photo = (id, w, h) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=75`;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Прогресс «липкой» секции: 0 — доехала до верха экрана, 1 — досмотрена
function stickyProgress(section) {
  const rect = section.getBoundingClientRect();
  const distance = rect.height - window.innerHeight;
  return distance > 0 ? clamp(-rect.top / distance) : 0;
}

// Генератор «случайных» чисел: для одного текста всегда одинаковый результат
function seeded(text) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
}


// =========================================================
// 1. ДАННЫЕ МЕНЮ
// =========================================================
const menuTabs = [
  { id: 'meat', name: 'Мясо' },
  { id: 'fish', name: 'Рыба' },
  { id: 'veg', name: 'Овощи и салаты' },
  { id: 'starters', name: 'Закуски' },
  { id: 'dessert', name: 'Десерты' },
];

const menu = [
  { tab: 'meat', name: 'Рибай 21 день', desc: 'Мраморная говядина сухого вызревания, соль Мальдон', weight: '350 г', price: 2890, photo: '1588168333986-5078d3ae3976', tag: 'Шеф рекомендует' },
  { tab: 'meat', name: 'Томагавк', desc: 'Стейк на кости для двоих, печёный чеснок, розмарин', weight: '1 200 г', price: 7900, photo: '1690618513975-324617013892', tag: 'На двоих' },
  { tab: 'meat', name: 'Стриплойн с картофелем', desc: 'Картофель фри на говяжьем жиру, соус демиглас', weight: '300 г', price: 1890, photo: '1600891964092-4316c288032e' },
  { tab: 'meat', name: 'Мясная доска', desc: 'Три вида стейков, молодой картофель, три соуса', weight: '900 г', price: 4600, photo: '1594041680534-e8c8cdebd659', tag: 'На компанию' },
  { tab: 'meat', name: 'Нью-Йорк со спаржей', desc: 'Спаржа и морковь с углей, масло с травами', weight: '300 г', price: 2190, photo: '1546964124-0cce460f38ef' },
  { tab: 'fish', name: 'Лосось на углях', desc: 'Сальса из томатов и авокадо, лайм', weight: '220 г', price: 1490, photo: '1467003909585-2f8a72700288' },
  { tab: 'fish', name: 'Сибас с беурбланом', desc: 'Целая рыба на решётке, соус из белого вина', weight: '280 г', price: 1690, photo: '1676471926534-d5c9771909fa' },
  { tab: 'fish', name: 'Лобстер со сморчками', desc: 'Хвост лобстера, сморчки, сливочный соус', weight: '250 г', price: 3900, photo: '1593854989775-ae5e4d9e49e9', tag: 'Шеф рекомендует' },
  { tab: 'veg', name: 'Артишоки с углей', desc: 'Апельсин, мята, оливковое масло', weight: '200 г', price: 790, photo: '1519077336050-4ca5cac9d64f' },
  { tab: 'veg', name: 'Салат с курицей гриль', desc: 'Авокадо, томаты, кунжутная заправка', weight: '260 г', price: 690, photo: '1761315600943-d8a5bb0c499f' },
  { tab: 'veg', name: 'Овощи на углях', desc: 'Тыква, кукуруза, морковь, соус чимичурри', weight: '300 г', price: 590, photo: '1484412509196-57eda96981e8' },
  { tab: 'starters', name: 'Сет «На компанию»', desc: 'Крылья, картофель, салат и соусы на 4 человек', weight: '1 400 г', price: 2900, photo: '1601356616077-695728ae17cb', tag: 'На компанию' },
  { tab: 'starters', name: 'Утиная грудка', desc: 'Вишнёвый соус, пюре из сельдерея', weight: '180 г', price: 1190, photo: '1514326640560-7d063ef2aed5' },
  { tab: 'dessert', name: 'Шоколадный фондан', desc: 'Жидкий центр, ванильное мороженое', weight: '150 г', price: 520, photo: '1642220618391-72214d19711c' },
  { tab: 'dessert', name: 'Мороженое с карамелью', desc: 'Солёная карамель, хрустящая вафля', weight: '140 г', price: 420, photo: '1551024506-0bccd828d307' },
  { tab: 'dessert', name: 'Медовик с малиной', desc: 'Тонкие коржи, сметанный крем', weight: '160 г', price: 480, photo: '1521704042371-f13409bf0e6d' },
  { tab: 'dessert', name: 'Яблочный пирог', desc: 'Печём утром, подаём тёплым', weight: '170 г', price: 450, photo: '1633285708779-c62ea47708b9' },
];


// =========================================================
// 2. ПЕРВЫЙ ЭКРАН: разбиваем заголовок на буквы и задаём каждой своё направление
// =========================================================
function splitLetters(el) {
  const random = seeded(el.textContent);
  const wrap = text => [...text].map(ch => {
    // каждой букве — своё направление и угол разлёта
    const sx = (random() - 0.5) * window.innerWidth * 0.9;
    const sy = (random() - 0.5) * window.innerHeight * 0.9;
    const sr = (random() - 0.5) * 140;
    return `<span class="ch" style="--sx:${sx.toFixed(0)};--sy:${sy.toFixed(0)};--sr:${sr.toFixed(0)}">${ch}</span>`;
  }).join('');

  // Сохраняем <em> внутри заголовка: проходим по всем частям
  el.innerHTML = [...el.childNodes].map(node =>
    node.nodeType === Node.TEXT_NODE ? wrap(node.textContent) : `<em>${wrap(node.textContent)}</em>`
  ).join('');
}
document.querySelectorAll('[data-split]').forEach(splitLetters);


// =========================================================
// 3. ИСКРЫ НАД УГЛЯМИ (canvas)
// =========================================================
const embersCanvas = document.getElementById('embers');
const ctx = embersCanvas.getContext('2d');
let embers = [];
let embersIntensity = 0.5;

function resizeEmbers() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  embersCanvas.width = embersCanvas.clientWidth * dpr;
  embersCanvas.height = embersCanvas.clientHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const count = window.innerWidth < 600 ? 34 : 70;
  embers = Array.from({ length: count }, () => newEmber(true));
}

function newEmber(anywhere) {
  const w = embersCanvas.clientWidth;
  const h = embersCanvas.clientHeight;
  return {
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : h + 10,
    size: 0.8 + Math.random() * 2.2,
    speed: 0.3 + Math.random() * 1.1,
    drift: (Math.random() - 0.5) * 0.6,
    phase: Math.random() * Math.PI * 2,
    life: 0.4 + Math.random() * 0.6,
  };
}

function drawEmbers(time) {
  const w = embersCanvas.clientWidth;
  const h = embersCanvas.clientHeight;
  ctx.clearRect(0, 0, w, h);
  embers.forEach((e, i) => {
    e.y -= e.speed * (0.6 + embersIntensity);
    e.x += e.drift + Math.sin(time / 600 + e.phase) * 0.35; // искры покачиваются
    const fade = clamp(e.y / h) * e.life;               // гаснут к верху экрана
    const flick = 0.6 + Math.sin(time / 90 + e.phase) * 0.4; // мерцание
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, ${140 + Math.round(flick * 60)}, 60, ${fade * flick})`;
    ctx.shadowColor = 'rgba(255, 106, 43, .9)';
    ctx.shadowBlur = 8;
    ctx.fill();
    if (e.y < -10) embers[i] = newEmber(false);
  });
}


// =========================================================
// 4. МЕНЮ: вкладки, строки и фото за курсором
// =========================================================
const menuTabsEl = document.getElementById('menuTabs');
const menuList = document.getElementById('menuList');
const preview = document.getElementById('menuPreview');
const previewImg = document.getElementById('menuPreviewImg');
let activeMenuTab = 'meat';

function renderMenuTabs() {
  menuTabsEl.innerHTML = menuTabs.map(t => `
    <button class="menu-tab ${t.id === activeMenuTab ? 'is-active' : ''}" data-tab="${t.id}" role="tab" aria-selected="${t.id === activeMenuTab}">${t.name}</button>
  `).join('');
}

function renderMenu() {
  const items = menu.filter(m => m.tab === activeMenuTab);
  menuList.innerHTML = items.map((m, i) => `
    <li class="menu-row" data-photo="${m.photo}" style="--i: ${i}">
      <span class="menu-row__num">${String(i + 1).padStart(2, '0')}</span>
      <img class="menu-row__thumb" src="${photo(m.photo, 160, 160)}" alt="" loading="lazy">
      <div class="menu-row__main">
        <h3 class="menu-row__name">${m.name}${m.tag ? `<span class="menu-row__tag">${m.tag}</span>` : ''}</h3>
        <p class="menu-row__desc">${m.desc}</p>
      </div>
      <span class="menu-row__weight">${m.weight}</span>
      <span class="menu-row__price">${formatPrice(m.price)}</span>
    </li>`).join('');
}

menuTabsEl.addEventListener('click', e => {
  const btn = e.target.closest('[data-tab]');
  if (!btn) return;
  activeMenuTab = btn.dataset.tab;
  renderMenuTabs();
  renderMenu();
});

// Превью: показываем фото блюда при наведении на строку
const previewPos = { x: 0, y: 0, rot: 0 };
let previewActive = false;
if (hasMouse) {
  menuList.addEventListener('mouseover', e => {
    const row = e.target.closest('.menu-row');
    if (!row) return;
    previewImg.src = photo(row.dataset.photo, 560, 680);
    if (!previewActive) { previewPos.x = mouse.x; previewPos.y = mouse.y; } // появляемся сразу у курсора
    preview.classList.add('is-visible');
    previewActive = true;
  });
  menuList.addEventListener('mouseleave', () => {
    preview.classList.remove('is-visible');
    previewActive = false;
  });
}


// =========================================================
// 5. ЭЛЕМЕНТЫ СЦЕН
// =========================================================
const header = document.getElementById('header');
const scrollBar = document.getElementById('scrollProgress');

const hero = document.querySelector('.hero');
const heroStage = document.getElementById('heroStage');

const manifestLines = [...document.querySelectorAll('.manifest__line')];
const manifest = document.getElementById('manifest');

const processSection = document.querySelector('.process');
const processImgs = [...document.querySelectorAll('#processMedia img')];
const processTexts = [...document.querySelectorAll('.process__text')];
const processNum = document.getElementById('processNum');
const processUnit = document.getElementById('processUnit');
const processDots = document.getElementById('processDots');
const processValues = [
  { value: 450, unit: '°' },
  { value: 21, unit: 'дней' },
  { value: 12, unit: 'минут' },
  { value: 5, unit: 'минут' },
];
let processIndex = -1;

const gallery = document.querySelector('.gallery');
const galleryGrid = document.getElementById('galleryGrid');
const galleryCaption = document.getElementById('galleryCaption');
const galleryStage = gallery.querySelector('.gallery__stage');

const chefImg = document.querySelector('[data-parallax]');
const chefSign = document.getElementById('chefSign');
const signPaths = [...chefSign.querySelectorAll('path')];
signPaths.forEach(p => {
  const len = p.getTotalLength();
  p.style.strokeDasharray = len;
  p.style.strokeDashoffset = len;
  p.dataset.len = len;
});


// =========================================================
// 6. СЦЕНЫ ПРОКРУТКИ
// =========================================================

// --- Первый экран: тарелка растёт и крутится, буквы разлетаются ---
function updateHero() {
  const p = reducedMotion ? 0 : stickyProgress(hero);
  const vw = window.innerWidth;
  const vh = heroStage.clientHeight;
  const narrow = vw <= 900; // планшет и телефон: тарелка уезжает вверх, а не вправо

  const grow = easeInOut(range(p, 0, 0.5));    // фаза 1: растёт
  const move = easeInOut(range(p, 0.5, 0.88)); // фаза 2: уезжает в сторону
  const finalScale = vw <= 600 ? 0.72 : narrow ? 0.8 : 0.95;

  const s = heroStage.style;
  s.setProperty('--plate-scale', (move > 0 ? lerp(1.35, finalScale, move) : lerp(0.72, 1.35, grow)).toFixed(4));
  s.setProperty('--plate-rot', `${(p * 300).toFixed(2)}deg`);
  s.setProperty('--plate-x', `${narrow ? 0 : lerp(0, vw * 0.24, move)}px`);
  s.setProperty('--plate-y', `${narrow ? lerp(0, -vh * 0.2, move) : 0}px`);
  s.setProperty('--scatter', easeOut(range(p, 0.04, 0.42)).toFixed(4));
  s.setProperty('--bottom-opacity', (1 - range(p, 0, 0.14)).toFixed(3));
  s.setProperty('--hint-opacity', (1 - range(p, 0, 0.04)).toFixed(3));
  s.setProperty('--glow', lerp(0.5, 1, grow).toFixed(3));
  s.setProperty('--final-opacity', range(p, 0.62, 0.85).toFixed(3));
  s.setProperty('--final-shift', `${lerp(40, 0, easeOut(range(p, 0.62, 0.92)))}px`);
  heroStage.classList.toggle('is-final', p > 0.7);

  embersIntensity = lerp(0.5, 1.6, grow);
}

// --- Манифест: строки «накаляются» по очереди ---
function updateManifest() {
  const rect = manifest.getBoundingClientRect();
  const vh = window.innerHeight;
  const p = reducedMotion ? 1 : clamp((vh * 0.85 - rect.top) / (rect.height + vh * 0.3));
  manifestLines.forEach((line, i) => {
    const local = clamp(p * manifestLines.length - i);
    line.style.setProperty('--fill', `${(local * 115).toFixed(1)}%`);
  });
}

// --- Как мы готовим: 4 этапа на одной липкой сцене ---
function animateNumber(from, to) {
  const start = performance.now();
  const duration = 700;
  function tick(now) {
    const t = clamp((now - start) / duration);
    processNum.textContent = Math.round(lerp(from, to, easeOut(t)));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function setProcessStage(index) {
  if (index === processIndex) return;
  const prev = processIndex >= 0 ? processValues[processIndex].value : 0;
  processIndex = index;
  processImgs.forEach((img, i) => img.classList.toggle('is-active', i === index));
  processTexts.forEach((t, i) => t.classList.toggle('is-active', i === index));
  [...processDots.children].forEach((d, i) => {
    d.classList.toggle('is-active', i === index);
    d.setAttribute('aria-current', i === index);
  });
  processUnit.textContent = processValues[index].unit === '°' ? '°' : ` ${processValues[index].unit}`;
  if (reducedMotion) processNum.textContent = processValues[index].value;
  else animateNumber(prev, processValues[index].value);
}

function updateProcess() {
  if (reducedMotion) return;
  const p = stickyProgress(processSection);
  const count = processValues.length;
  const index = Math.min(count - 1, Math.floor(p * count));
  const local = clamp(p * count - index);
  setProcessStage(index);
  // активное фото медленно «отъезжает» от 1.15 до 1 внутри своего этапа
  processImgs[index].style.setProperty('--zoom', lerp(1.15, 1, local).toFixed(4));
}

// Точки этапов — кнопки: по клику прокручиваем к нужному этапу
processDots.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const i = [...processDots.children].indexOf(btn);
  if (reducedMotion) { setProcessStage(i); return; }
  const distance = processSection.offsetHeight - window.innerHeight;
  window.scrollTo({ top: processSection.offsetTop + distance * ((i + 0.5) / processValues.length), behavior: 'smooth' });
});

// --- Галерея: центральное фото отдаляется и становится частью сетки ---
function updateGallery() {
  const vw = window.innerWidth;
  const vh = galleryStage.clientHeight;
  const gap = vw <= 600 ? 8 : vw * 0.016;
  // Размер одной ячейки сетки без масштаба
  const cellW = (vw - gap * 4) / 3;
  const cellH = (vh - gap * 4) / 3;
  // Во сколько раз увеличить сетку, чтобы центральное фото закрыло весь экран
  const startScale = Math.max(vw / cellW, vh / cellH);

  const p = reducedMotion ? 1 : stickyProgress(gallery);
  const t = easeInOut(range(p, 0.08, 0.85));
  galleryGrid.style.setProperty('--gscale', lerp(startScale, 1, t).toFixed(4));
  galleryGrid.style.setProperty('--img-zoom', lerp(1.25, 1, t).toFixed(4));
  galleryCaption.style.setProperty('--caption-opacity', (1 - range(p, 0.04, 0.22)).toFixed(3));
}

// --- Шеф: фото плавает внутри рамки, подпись рисуется ---
function updateChef() {
  const vh = window.innerHeight;
  const frame = chefImg.parentElement.getBoundingClientRect();
  if (!reducedMotion) {
    const offset = (frame.top + frame.height / 2 - vh / 2) / vh; // от -1 до 1
    chefImg.style.transform = `translate3d(0, ${(-8 - offset * 8).toFixed(2)}%, 0)`;
  }

  const rect = chefSign.getBoundingClientRect();
  const p = reducedMotion ? 1 : clamp((vh * 0.92 - rect.top) / (vh * 0.45));
  signPaths.forEach((path, i) => {
    const local = i === 0 ? range(p, 0, 0.75) : range(p, 0.7, 1);
    path.style.strokeDashoffset = path.dataset.len * (1 - local);
  });
}

// --- Шапка ---
let menuOpen = false;
let lastScrollY = window.scrollY;
function updateHeader(y) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  scrollBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  header.classList.toggle('is-scrolled', y > 40);
  if (menuOpen) return;
  if (y > lastScrollY + 4 && y > 300) header.classList.add('is-hidden');
  else if (y < lastScrollY - 4) header.classList.remove('is-hidden');
}

function updateScenes() {
  updateHero();
  updateManifest();
  updateProcess();
  updateGallery();
  updateChef();
}


// =========================================================
// 7. КУРСОР И ГЛАВНЫЙ ЦИКЛ
// =========================================================
const cursor = document.getElementById('cursor');
const cursorLabel = document.getElementById('cursorLabel');
const mouse = { x: -100, y: -100 };
const cursorPos = { x: -100, y: -100 };

if (hasMouse) {
  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    const target = e.target.closest('[data-cursor]');
    cursor.classList.toggle('is-big', Boolean(target) && !previewActive);
    if (target) cursorLabel.textContent = target.dataset.cursor;
    cursor.classList.remove('is-hidden');
  });
  document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
}

let needsUpdate = true;
function loop(time) {
  const y = window.scrollY;
  if (y !== lastScrollY || needsUpdate) {
    updateHeader(y);
    updateScenes();
    needsUpdate = false;
  }
  lastScrollY = y;

  // Искры рисуем, только пока первый экран виден
  if (!reducedMotion && hero.getBoundingClientRect().bottom > 0) drawEmbers(time);

  if (hasMouse) {
    cursorPos.x = lerp(cursorPos.x, mouse.x, 0.2);
    cursorPos.y = lerp(cursorPos.y, mouse.y, 0.2);
    cursor.style.transform = `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)`;

    if (previewActive) {
      // превью догоняет мышь медленнее и наклоняется в сторону движения
      const dx = mouse.x - previewPos.x;
      previewPos.x = lerp(previewPos.x, mouse.x, 0.12);
      previewPos.y = lerp(previewPos.y, mouse.y, 0.12);
      previewPos.rot = lerp(previewPos.rot, clamp(dx * 0.08, -14, 14), 0.15);
      preview.style.translate = `${previewPos.x}px ${previewPos.y}px`;
      preview.style.rotate = `${previewPos.rot}deg`;
    }
  }
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  resizeEmbers();
  needsUpdate = true;
});


// =========================================================
// 8. ПОЯВЛЕНИЕ ПРИ ПРОКРУТКЕ
// =========================================================
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('[data-reveal], #footerBig').forEach(el => revealObserver.observe(el));

// Подписи курсора для «листательных» сцен
heroStage.dataset.cursor = 'Листайте';
galleryStage.dataset.cursor = 'Листайте';


// =========================================================
// 9. МЕНЮ-БУРГЕР
// =========================================================
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
function toggleMenu(open) {
  menuOpen = open;
  nav.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  if (open) header.classList.remove('is-hidden');
}
burger.addEventListener('click', () => toggleMenu(!menuOpen));
nav.addEventListener('click', e => { if (e.target.tagName === 'A') toggleMenu(false); });


// =========================================================
// 10. БРОНЬ ПО СХЕМЕ ЗАЛА
// =========================================================
// shape: round — круглый на 2, square — квадратный на 4, rect — на 6, long — шефский на 8
const tables = [
  { id: 1,  seats: 2, shape: 'round',  x: 580, y: 112, zone: 'у окна' },
  { id: 2,  seats: 2, shape: 'round',  x: 580, y: 186, zone: 'у окна' },
  { id: 3,  seats: 2, shape: 'round',  x: 580, y: 260, zone: 'у окна' },
  { id: 4,  seats: 2, shape: 'round',  x: 580, y: 334, zone: 'у окна' },
  { id: 5,  seats: 4, shape: 'square', x: 300, y: 168, zone: 'у открытой кухни' },
  { id: 6,  seats: 4, shape: 'square', x: 430, y: 168, zone: 'у открытой кухни' },
  { id: 7,  seats: 4, shape: 'square', x: 300, y: 272, zone: 'в центре зала' },
  { id: 8,  seats: 4, shape: 'square', x: 430, y: 272, zone: 'в центре зала' },
  { id: 9,  seats: 6, shape: 'rect',   x: 150, y: 160, zone: 'у бара' },
  { id: 10, seats: 6, shape: 'rect',   x: 150, y: 282, zone: 'у бара' },
  { id: 11, seats: 8, shape: 'long',   x: 340, y: 370, zone: 'шефский стол' },
  { id: 12, seats: 2, shape: 'round',  x: 505, y: 370, zone: 'у входа' },
];

const MAX_GUESTS = 12;
const DAY_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

const booking = { guests: 2, dateIndex: 0, time: null, table: null };

const hallSvg = document.getElementById('hallSvg');
const hallMap = document.querySelector('.hall__map');
const hallStatus = document.getElementById('hallStatus');
const hallLoading = document.getElementById('hallLoading');
const hallEmpty = document.getElementById('hallEmpty');
const hallHint = document.getElementById('hallHint');
const confirmBox = document.getElementById('confirm');
const confirmSummary = document.getElementById('confirmSummary');
const bookForm = document.getElementById('bookForm');
const bookSubmit = document.getElementById('bookSubmit');
const bookError = document.getElementById('bookError');
const ticket = document.getElementById('ticket');
const datesEl = document.getElementById('bookDates');
const timesEl = document.getElementById('bookTimes');
const guestsValue = document.getElementById('guestsValue');
const guestsMinus = document.getElementById('guestsMinus');
const guestsPlus = document.getElementById('guestsPlus');

// Ближайшие 7 дней
const days = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + i);
  return d;
});
const dateKey = d => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const dayLabel = (d, i) => (i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : DAY_SHORT[d.getDay()]);
const longDate = d => `${DAY_SHORT[d.getDay()]}, ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;

// Время с 12:00 до 23:00 каждые 30 минут
const TIMES = [];
for (let m = 12 * 60; m <= 23 * 60; m += 30) TIMES.push(`${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`);
const toMinutes = t => Number(t.split(':')[0]) * 60 + Number(t.split(':')[1]);

// На сегодня нельзя забронировать время, до которого меньше часа
function isTimePast(dateIndex, time) {
  if (dateIndex !== 0) return false;
  const now = new Date();
  return toMinutes(time) < now.getHours() * 60 + now.getMinutes() + 60;
}

// Занят ли стол (в реальном проекте это придёт с сервера)
function isBusy(table, dateIndex, time) {
  const d = days[dateIndex];
  const random = seeded(`${dateKey(d)}|${time}|${table.id}`);
  let rate = 0.3;
  const minutes = toMinutes(time);
  if (minutes >= 19 * 60 && minutes <= 21 * 60) rate += 0.25; // вечером люднее
  if (d.getDay() === 5 || d.getDay() === 6) rate += 0.15;     // в пятницу и субботу тоже
  return random() < rate;
}

// Подходит ли стол по числу гостей: мест хватает, но стол не слишком большой
const fits = (table, guests) => table.seats >= guests && table.seats - guests <= 4;

function freeTables(dateIndex, time, guests) {
  return tables.filter(t => fits(t, guests) && !isBusy(t, dateIndex, time));
}

// --- Рисуем схему зала ---
function chairsFor(t) {
  const c = [];
  if (t.shape === 'round') c.push([-32, 0], [32, 0]);
  if (t.shape === 'square') c.push([0, -40], [0, 40], [-40, 0], [40, 0]);
  if (t.shape === 'rect') c.push([-24, -38], [24, -38], [-24, 38], [24, 38], [-62, 0], [62, 0]);
  if (t.shape === 'long') c.push([-60, -32], [0, -32], [60, -32], [-60, 32], [0, 32], [60, 32], [-112, 0], [112, 0]);
  return c;
}

function shapeFor(t) {
  if (t.shape === 'round') return `<circle class="table__shape" cx="${t.x}" cy="${t.y}" r="20"/>`;
  const size = { square: [56, 56], rect: [96, 52], long: [196, 42] }[t.shape];
  return `<rect class="table__shape" x="${t.x - size[0] / 2}" y="${t.y - size[1] / 2}" width="${size[0]}" height="${size[1]}" rx="8"/>`;
}

function drawHall() {
  const stools = Array.from({ length: 6 }, (_, i) => `<circle class="table__chair" cx="74" cy="${130 + i * 44}" r="7"/>`).join('');
  hallSvg.innerHTML = `
    <rect class="hall__wall" x="8" y="8" width="624" height="404" rx="16"/>
    <line class="hall__window" x1="628" y1="80" x2="628" y2="370"/>
    <text class="hall__label" x="614" y="66" text-anchor="end">окна</text>
    <rect class="hall__zone" x="200" y="22" width="280" height="68" rx="12"/>
    <text class="hall__zone-label" x="340" y="61" text-anchor="middle">Открытая кухня</text>
    <rect class="hall__bar" x="24" y="110" width="30" height="250" rx="8"/>
    <text class="hall__label" x="39" y="235" text-anchor="middle" transform="rotate(-90 39 235)">бар</text>
    ${stools}
    <text class="hall__label" x="610" y="402" text-anchor="end">вход ↓</text>
    ${tables.map(t => `
      <g class="table" data-id="${t.id}" tabindex="0" role="button" aria-label="Стол ${t.id}, ${t.seats} места, ${t.zone}">
        ${chairsFor(t).map(([dx, dy]) => `<circle class="table__chair" cx="${t.x + dx}" cy="${t.y + dy}" r="6"/>`).join('')}
        ${shapeFor(t)}
        <text class="table__num" x="${t.x}" y="${t.y}">${t.id}</text>
      </g>`).join('')}
  `;
}

// --- Обновляем состояние столов ---
function updateHall() {
  const { guests, dateIndex, time } = booking;
  const free = freeTables(dateIndex, time, guests);
  const suitable = tables.filter(t => fits(t, guests));

  // Если выбранный стол стал занят или не подходит — снимаем выбор
  if (booking.table && !free.some(t => t.id === booking.table)) booking.table = null;

  hallSvg.querySelectorAll('.table').forEach(g => {
    const t = tables.find(x => x.id === Number(g.dataset.id));
    const unfit = !fits(t, guests);
    const busy = !unfit && isBusy(t, dateIndex, time);
    g.classList.toggle('is-unfit', unfit);
    g.classList.toggle('is-busy', busy);
    g.classList.toggle('is-picked', t.id === booking.table);
    g.setAttribute('aria-disabled', unfit || busy);
  });

  hallStatus.textContent = suitable.length
    ? `Свободно ${free.length} из ${suitable.length} столов для ${guests} ${plural(guests, 'гостя', 'гостей', 'гостей')}`
    : 'Нет столов на такую компанию';

  renderEmpty(free, suitable);
  renderConfirm();
}

const plural = (n, one, few, many) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
};

// --- Состояние «пусто»: подсказываем другое время ---
function renderEmpty(free, suitable) {
  if (free.length > 0) {
    hallEmpty.hidden = true;
    return;
  }
  hallEmpty.hidden = false;

  if (!suitable.length) {
    hallEmpty.innerHTML = `
      <strong>Компания больше 8 человек?</strong>
      <p>Соберём столы вместе или закроем зал под вас. Позвоните — обсудим меню и депозит.</p>
      <a class="btn btn--ember btn--small" href="tel:+79000000000">+7 (900) 000-00-00</a>`;
    return;
  }

  const alternatives = TIMES
    .filter(t => !isTimePast(booking.dateIndex, t) && freeTables(booking.dateIndex, t, booking.guests).length)
    .sort((a, b) => Math.abs(toMinutes(a) - toMinutes(booking.time)) - Math.abs(toMinutes(b) - toMinutes(booking.time)))
    .slice(0, 4)
    .sort((a, b) => toMinutes(a) - toMinutes(b));

  hallEmpty.innerHTML = `
    <strong>На ${booking.time} всё занято</strong>
    <p>${alternatives.length ? 'Есть свободные столы в другое время этого дня:' : 'В этот день свободных столов на вашу компанию нет. Попробуйте другую дату.'}</p>
    <div class="chips">${alternatives.map(t => `<button class="chip" type="button" data-alt="${t}">${t}</button>`).join('')}</div>`;
}

hallEmpty.addEventListener('click', e => {
  const btn = e.target.closest('[data-alt]');
  if (!btn) return;
  booking.time = btn.dataset.alt;
  renderTimes();
  refreshHall();
});

// --- Шаг подтверждения ---
function renderConfirm() {
  const t = tables.find(x => x.id === booking.table);
  confirmBox.hidden = !t || !ticket.hidden;
  hallHint.hidden = Boolean(t) || !ticket.hidden;
  if (!t) return;
  const g = booking.guests;
  confirmSummary.innerHTML =
    `Стол <strong>№${t.id}</strong> ${t.zone} · ${t.seats} ${plural(t.seats, 'место', 'места', 'мест')} · ` +
    `<strong>${longDate(days[booking.dateIndex])}, ${booking.time}</strong> · ${g} ${plural(g, 'гость', 'гостя', 'гостей')}`;
}

// --- Загрузка: имитируем запрос к серверу при смене параметров ---
let hallTimer = null;
function refreshHall() {
  clearTimeout(hallTimer);
  hallMap.classList.add('is-loading');
  hallLoading.hidden = false;
  hallEmpty.hidden = true;
  hallTimer = setTimeout(() => {
    hallMap.classList.remove('is-loading');
    hallLoading.hidden = true;
    updateHall();
  }, 450);
}

// --- Даты, время, гости ---
function renderDates() {
  datesEl.innerHTML = days.map((d, i) => `
    <button class="chip ${i === booking.dateIndex ? 'is-active' : ''}" type="button" data-date="${i}">
      ${dayLabel(d, i)}<small>${d.getDate()} ${d.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')}</small>
    </button>`).join('');
}

function renderTimes() {
  timesEl.innerHTML = TIMES.map(t => {
    const past = isTimePast(booking.dateIndex, t);
    return `<button class="chip ${t === booking.time ? 'is-active' : ''}" type="button" data-time="${t}" ${past ? 'disabled' : ''}>${t}</button>`;
  }).join('');
}

// Выбираем удобное время по умолчанию: 19:00 или ближайшее доступное
function pickDefaultTime() {
  const available = TIMES.filter(t => !isTimePast(booking.dateIndex, t));
  if (!available.length) return null;
  if (booking.time && available.includes(booking.time)) return booking.time;
  return available.includes('19:00') ? '19:00' : available[0];
}

function renderGuests() {
  guestsValue.textContent = booking.guests;
  guestsMinus.disabled = booking.guests <= 1;
  guestsPlus.disabled = booking.guests >= MAX_GUESTS;
}

datesEl.addEventListener('click', e => {
  const btn = e.target.closest('[data-date]');
  if (!btn) return;
  booking.dateIndex = Number(btn.dataset.date);
  booking.time = pickDefaultTime();
  renderDates();
  renderTimes();
  refreshHall();
});

timesEl.addEventListener('click', e => {
  const btn = e.target.closest('[data-time]');
  if (!btn || btn.disabled) return;
  booking.time = btn.dataset.time;
  renderTimes();
  refreshHall();
});

guestsMinus.addEventListener('click', () => { booking.guests--; renderGuests(); refreshHall(); });
guestsPlus.addEventListener('click', () => { booking.guests++; renderGuests(); refreshHall(); });

// --- Выбор стола кликом или клавиатурой ---
function pickTable(g) {
  if (!g || g.getAttribute('aria-disabled') === 'true') return;
  booking.table = Number(g.dataset.id);
  bookError.hidden = true;
  updateHall();
  // на телефоне подкручиваем к форме
  if (window.innerWidth <= 900) confirmBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
hallSvg.addEventListener('click', e => pickTable(e.target.closest('.table')));
hallSvg.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    pickTable(e.target.closest('.table'));
  }
});

// --- Форма ---
function formatPhone(value) {
  let d = value.replace(/\D/g, '');
  if (!d) return '';
  if (d[0] === '8') d = '7' + d.slice(1);
  if (d[0] !== '7') d = '7' + d;
  d = d.slice(0, 11);
  let r = '+7';
  if (d.length > 1) r += ' (' + d.slice(1, 4);
  if (d.length >= 5) r += ') ' + d.slice(4, 7);
  if (d.length >= 8) r += '-' + d.slice(7, 9);
  if (d.length >= 10) r += '-' + d.slice(9, 11);
  return r;
}

function setError(input, message) {
  const field = input.closest('.field');
  field.classList.toggle('has-error', Boolean(message));
  field.querySelector('.field__error').textContent = message;
}

function validate() {
  const checks = [
    [bookForm.name, bookForm.name.value.trim().length < 2 ? 'Напишите имя — на него оформим бронь' : ''],
    [bookForm.phone, bookForm.phone.value.replace(/\D/g, '').length !== 11 ? 'Нужен номер полностью: +7 и 10 цифр' : ''],
  ];
  let first = null;
  checks.forEach(([input, msg]) => {
    setError(input, msg);
    if (msg && !first) first = input;
  });
  if (first) first.focus();
  return !first;
}

function sendBooking() {
  // ДЕМО: имитация запроса. В рабочем проекте здесь будет fetch на сервер ресторана
  return new Promise((resolve, reject) => {
    setTimeout(() => (navigator.onLine ? resolve() : reject(new Error('offline'))), 1300);
  });
}

bookForm.addEventListener('submit', async e => {
  e.preventDefault();
  bookError.hidden = true;
  if (!validate()) return;

  bookSubmit.classList.add('is-loading');
  bookSubmit.textContent = 'Бронируем…';
  try {
    await sendBooking();
    const t = tables.find(x => x.id === booking.table);
    const name = bookForm.name.value.trim();
    document.getElementById('ticketText').textContent =
      `${name}, ждём вас. Стол держим 15 минут после назначенного времени. SMS с подтверждением уже летит.`;
    document.getElementById('ticketRows').innerHTML = `
      <div><span>Дата</span><strong>${days[booking.dateIndex].toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '')}</strong></div>
      <div><span>Время</span><strong>${booking.time}</strong></div>
      <div><span>Стол</span><strong>№${t.id}</strong></div>
      <div><span>Гости</span><strong>${booking.guests}</strong></div>`;
    ticket.hidden = false;
    confirmBox.hidden = true;
    hallHint.hidden = true;
  } catch {
    bookError.textContent = 'Не получилось отправить — похоже, пропал интернет. Стол пока за вами: нажмите «Забронировать» ещё раз.';
    bookError.hidden = false;
  } finally {
    bookSubmit.classList.remove('is-loading');
    bookSubmit.textContent = 'Забронировать';
  }
});

bookForm.phone.addEventListener('input', () => { bookForm.phone.value = formatPhone(bookForm.phone.value); });
bookForm.querySelectorAll('input').forEach(i => i.addEventListener('input', () => setError(i, '')));

document.getElementById('ticketNew').addEventListener('click', () => {
  ticket.hidden = true;
  booking.table = null;
  bookForm.reset();
  updateHall();
});


// =========================================================
// ЗАПУСК
// =========================================================
renderMenuTabs();
renderMenu();

drawHall();
booking.time = pickDefaultTime();
if (!booking.time) {            // сегодня уже поздно — показываем завтра
  booking.dateIndex = 1;
  booking.time = pickDefaultTime();
}
renderGuests();
renderDates();
renderTimes();
updateHall();

setProcessStage(0);
resizeEmbers();
requestAnimationFrame(loop);
