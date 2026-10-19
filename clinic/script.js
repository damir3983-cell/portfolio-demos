// =========================================================
// 0. УТИЛИТЫ
// =========================================================

// Ограничить число диапазоном (по умолчанию от 0 до 1)
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

// Плавно перейти от a к b. t = 0 → a, t = 1 → b
const lerp = (a, b, t) => a + (b - a) * t;

// Взять кусок прогресса: range(p, 0.2, 0.6) даёт 0 при p ≤ 0.2 и 1 при p ≥ 0.6
const range = (p, start, end) => clamp((p - start) / (end - start));

// Функции плавности: делают движение «живым», а не механическим
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = t => 1 - Math.pow(1 - t, 3);

const formatPrice = n => n.toLocaleString('ru-RU') + ' ₽';
const photoUrl = (id, w, h) => `https://images.unsplash.com/photo-${id}?w=${w}${h ? `&h=${h}` : ''}&fit=crop&auto=format&q=75`;

// Пользователь попросил систему уменьшить анимации — уважаем это
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Прогресс «липкой» секции: 0 — секция только доехала до верха экрана, 1 — досмотрена до конца
function stickyProgress(section) {
  const rect = section.getBoundingClientRect();
  const distance = rect.height - window.innerHeight;
  if (distance <= 0) return 0;
  return clamp(-rect.top / distance);
}


// =========================================================
// 1. ДАННЫЕ
// =========================================================
const directions = [
  { id: 'therapy', name: 'Терапия',       title: 'Терапия и check-up', text: 'Давление, усталость, непонятные анализы. Первичный приём — 40 минут.', price: 1900, photo: '1758691462123-8a17ae95d203' },
  { id: 'neuro',   name: 'Неврология',    title: 'Неврология',         text: 'Головная боль, спина, бессонница. Только лечение с доказанной пользой.', price: 2600, photo: '1758691463110-697a814b2033' },
  { id: 'kids',    name: 'Педиатрия',     title: 'Педиатрия',          text: 'Отдельный детский вход и игровая. Вызов врача на дом — за 3 часа.', price: 2100, photo: '1632053002928-1919605ee6f7' },
  { id: 'eye',     name: 'Офтальмология', title: 'Офтальмология',      text: 'Проверка зрения, давления и подбор очков за один визит.', price: 2200, photo: '1539036776273-021ec1d78bec' },
  { id: 'dental',  name: 'Стоматология',  title: 'Стоматология',       text: 'Лечение под микроскопом, гигиена за 60 минут. Гарантия 2 года.', price: 900, photo: '1598256989800-fe5f95da9787' },
  { id: 'mri',     name: 'МРТ и УЗИ',     title: 'МРТ, КТ и УЗИ',      text: 'Томограф 1,5 Тесла. Заключение рентгенолога — через 2 часа.', price: 2400, photo: '1666214280352-db292c05fd80' },
  { id: 'lab',     name: 'Анализы',       title: 'Лаборатория',        text: '800 видов анализов с 7:30. Результаты в приложении за 24 часа.', price: 450, photo: '1630959305790-4c956ce6c0b6' },
];

// featured: true — врач показывается в блоке «Врачи» с фото
const doctors = [
  { id: 'belova',    name: 'Анна Белова',     spec: 'Педиатр',             dir: 'kids',    exp: 12, photo: '1594824476967-48c8b964273f', featured: true },
  { id: 'karimov',   name: 'Тимур Каримов',   spec: 'Невролог',            dir: 'neuro',   exp: 14, photo: '1612349317150-e413f6a5b16d', featured: true },
  { id: 'orlova',    name: 'Елена Орлова',    spec: 'Офтальмолог',         dir: 'eye',     exp: 9,  photo: '1673865641073-4479f93a7776', featured: true },
  { id: 'rudenko',   name: 'Максим Руденко',  spec: 'Стоматолог-терапевт', dir: 'dental',  exp: 11, photo: '1622253692010-333f2da6031d', featured: true },
  { id: 'nesterova', name: 'Ольга Нестерова', spec: 'Терапевт, кардиолог', dir: 'therapy', exp: 18 },
  { id: 'lavrov',    name: 'Игорь Лавров',    spec: 'Терапевт',            dir: 'therapy', exp: 7 },
  { id: 'shapiro',   name: 'Вера Шапиро',     spec: 'Невролог',            dir: 'neuro',   exp: 8 },
  { id: 'sokolova',  name: 'Мария Соколова',  spec: 'Педиатр',             dir: 'kids',    exp: 9 },
  { id: 'gordeev',   name: 'Павел Гордеев',   spec: 'Офтальмолог',         dir: 'eye',     exp: 10 },
  { id: 'kim',       name: 'Сергей Ким',      spec: 'Стоматолог-хирург',   dir: 'dental',  exp: 15 },
  { id: 'mri-room',  name: 'Кабинет МРТ',     spec: 'Томограф 1,5 Тесла',  dir: 'mri',     room: true },
  { id: 'us-room',   name: 'Кабинет УЗИ',     spec: 'Экспертный аппарат',  dir: 'mri',     room: true },
  { id: 'lab-room',  name: 'Процедурный кабинет', spec: 'Сдача анализов',  dir: 'lab',     room: true },
];

const prices = [
  { dir: 'therapy', name: 'Приём терапевта, первичный',      time: '40 мин',   price: 1900 },
  { dir: 'therapy', name: 'Приём терапевта, повторный',      time: '30 мин',   price: 1500 },
  { dir: 'therapy', name: 'Check-up «Базовый»',              time: '3,5 часа', price: 9800 },
  { dir: 'therapy', name: 'ЭКГ с расшифровкой',              time: '15 мин',   price: 1200 },
  { dir: 'neuro',   name: 'Приём невролога, первичный',      time: '40 мин',   price: 2600 },
  { dir: 'neuro',   name: 'Приём невролога, повторный',      time: '30 мин',   price: 2100 },
  { dir: 'kids',    name: 'Приём педиатра',                  time: '40 мин',   price: 2100 },
  { dir: 'kids',    name: 'Вызов педиатра на дом',           time: 'за 3 часа', price: 4500 },
  { dir: 'kids',    name: 'Справка в школу или сад',         time: '20 мин',   price: 900 },
  { dir: 'eye',     name: 'Приём офтальмолога',              time: '30 мин',   price: 2200 },
  { dir: 'eye',     name: 'Подбор очков',                    time: '40 мин',   price: 1600 },
  { dir: 'eye',     name: 'Измерение глазного давления',     time: '10 мин',   price: 700 },
  { dir: 'dental',  name: 'Консультация стоматолога',        time: '30 мин',   price: 900 },
  { dir: 'dental',  name: 'Профессиональная гигиена',        time: '60 мин',   price: 5500 },
  { dir: 'dental',  name: 'Лечение кариеса',                 time: 'от 60 мин', price: 4900, from: true },
  { dir: 'dental',  name: 'Имплант под ключ',                time: '2 визита', price: 39000, from: true },
  { dir: 'mri',     name: 'МРТ одной зоны',                  time: '30 мин',   price: 5900 },
  { dir: 'mri',     name: 'МРТ головного мозга',             time: '30 мин',   price: 6400 },
  { dir: 'mri',     name: 'КТ грудной клетки',               time: '15 мин',   price: 4800 },
  { dir: 'mri',     name: 'УЗИ брюшной полости',             time: '30 мин',   price: 2400 },
  { dir: 'lab',     name: 'Общий анализ крови',              time: '1 день',   price: 450 },
  { dir: 'lab',     name: 'Биохимия крови, 12 показателей',  time: '1 день',   price: 2900 },
  { dir: 'lab',     name: 'Гормоны щитовидной железы',       time: '1 день',   price: 1350 },
  { dir: 'lab',     name: 'Витамин D',                       time: '2 дня',    price: 2200 },
];

const findDirection = id => directions.find(d => d.id === id);
const findDoctor = id => doctors.find(d => d.id === id);


// =========================================================
// 2. РАСПИСАНИЕ (имитация: в реальном проекте придёт с сервера)
// =========================================================
const DAY_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

// Генератор «случайных» чисел, который для одного и того же текста всегда даёт одно и то же.
// Так у врача на конкретный день всегда одинаковые занятые слоты.
function seededRandom(text) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
}

const dateKey = date => date.toISOString().slice(0, 10);
const toTime = minutes => `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
const isSameDay = (a, b) => dateKey(a) === dateKey(b);

// Все слоты врача на день: [{ time: '9:30', free: true }, ...]
function getSlots(doctorId, date) {
  const day = date.getDay();
  if (day === 0) return []; // воскресенье — выходной

  const start = day === 6 ? 9 * 60 : 8 * 60;   // суббота с 9:00
  const end = day === 6 ? 15 * 60 : 21 * 60;   // суббота до 15:00
  const random = seededRandom(doctorId + dateKey(date));
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes() + 30; // записаться можно минимум за 30 минут

  const slots = [];
  for (let m = start; m < end; m += 30) {
    const past = isSameDay(date, now) && m < nowMinutes;
    const busy = random() < 0.42;
    slots.push({ time: toTime(m), free: !past && !busy });
  }
  return slots;
}

// Ближайшие 10 дней, начиная с сегодня
function getNextDays(count = 10) {
  const days = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

// Ближайшее свободное время врача: { date, time } или null
function nextFreeSlot(doctorId) {
  for (const date of getNextDays(14)) {
    const slot = getSlots(doctorId, date).find(s => s.free);
    if (slot) return { date, time: slot.time };
  }
  return null;
}

// «сегодня», «завтра» или «пт, 24 октября»
function humanDate(date) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (isSameDay(date, today)) return 'сегодня';
  if (isSameDay(date, tomorrow)) return 'завтра';
  return `${DAY_SHORT[date.getDay()]}, ${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;
}


// =========================================================
// 3. РЕНДЕР КАРТОЧЕК (направления и врачи)
// =========================================================
document.getElementById('dirTrack').innerHTML = directions.map((d, i) => `
  <a href="#booking" class="dir" data-direction="${d.id}" data-cursor="Записаться">
    <div class="dir__img">
      <img src="${photoUrl(d.photo, 800, 640)}" alt="${d.title}" loading="lazy">
      <span class="dir__num">${String(i + 1).padStart(2, '0')}</span>
    </div>
    <div class="dir__body">
      <h3 class="dir__title">${d.title}</h3>
      <p class="dir__text">${d.text}</p>
      <div class="dir__bottom">
        <span class="dir__price">от ${formatPrice(d.price)}</span>
        <span class="dir__go" aria-hidden="true">→</span>
      </div>
    </div>
  </a>
`).join('');

document.getElementById('doctorsGrid').innerHTML = doctors
  .filter(d => d.featured)
  .map((d, i) => {
    const next = nextFreeSlot(d.id);
    return `
      <article class="doctor" style="--d: ${i}">
        <a href="#booking" class="doctor__photo" data-doctor="${d.id}" data-cursor="Записаться">
          <img src="${photoUrl(d.photo, 600, 800)}" alt="${d.name}, ${d.spec.toLowerCase()}" loading="lazy">
          <p class="doctor__next">Ближайший приём<strong>${next ? `${humanDate(next.date)} в ${next.time}` : 'уточняйте по телефону'}</strong></p>
        </a>
        <h3 class="doctor__name">${d.name}</h3>
        <p class="doctor__spec">${d.spec}</p>
        <div class="doctor__meta">
          <span class="doctor__exp">Стаж ${d.exp} лет</span>
          <a href="#booking" class="link-line doctor__book" data-doctor="${d.id}">Записаться</a>
        </div>
      </article>`;
  }).join('');


// =========================================================
// 4. БЕГУЩАЯ СТРОКА: дублируем содержимое, чтобы она была бесконечной
// =========================================================
const marqueeTrack = document.getElementById('marqueeTrack');
marqueeTrack.innerHTML += marqueeTrack.innerHTML;


// =========================================================
// 5. МАНИФЕСТ: разбиваем текст на слова, чтобы подсвечивать их по одному
// =========================================================
const manifest = document.getElementById('manifest');
manifest.innerHTML = manifest.textContent
  .trim()
  .split(/\s+/)
  .map(word => `<span class="w">${word}</span>`)
  .join(' ');
const manifestWords = [...manifest.querySelectorAll('.w')];
let manifestLit = -1;


// =========================================================
// 6. ГЛАВНЫЙ ДВИЖОК ПРОКРУТКИ
// Каждый кадр смотрим, сдвинулась ли страница. Если да — пересчитываем все сцены.
// =========================================================
const header = document.getElementById('header');
const scrollProgressBar = document.getElementById('scrollProgress');

const hero = document.querySelector('.hero');
const heroStage = hero.querySelector('.hero__stage');

const dirSection = document.getElementById('directions');
const dirTrack = document.getElementById('dirTrack');
const dirViewport = dirSection.querySelector('.directions__viewport');
const dirBar = document.getElementById('dirBar');
const dirCurrent = document.getElementById('dirCurrent');
const dirCards = [...dirTrack.children];
let dirDistance = 0;      // на сколько пикселей уезжает лента
let dirPinned = false;    // включён ли горизонтальный скролл (только компьютер)

const steps = [...document.querySelectorAll('.step')];
const stepsLine = document.querySelector('.steps__line');
const stepsFill = document.getElementById('stepsFill');
const checkupImages = [...document.querySelectorAll('#checkupFrame img')];
const checkupTime = document.getElementById('checkupTime');
let activeStep = -1;

const parallaxItems = [...document.querySelectorAll('[data-speed]')];

let lastScrollY = window.scrollY;
let velocity = 0;
let needsUpdate = true;

// Размеры, которые меняются только при изменении окна
function measure() {
  dirPinned = window.innerWidth > 900 && !reducedMotion;
  if (dirPinned) {
    dirDistance = dirTrack.scrollWidth - dirViewport.clientWidth;
    // Высота секции = экран + длина ленты: столько нужно прокрутить, чтобы увидеть все карточки
    dirSection.style.height = `${window.innerHeight + dirDistance}px`;
  } else {
    dirDistance = 0;
    dirSection.style.height = '';
  }
  needsUpdate = true;
}

// --- Сцена 1: первый экран ---
function updateHero() {
  const p = reducedMotion ? 0 : stickyProgress(hero);
  const vw = window.innerWidth;
  const vh = heroStage.clientHeight;
  const mobile = vw <= 600;

  // Начальное окно фото (совпадает со значениями в CSS)
  const startTop = vh * (mobile ? 0.56 : 0.52);
  const startBottom = vh * (mobile ? 0.03 : 0.06);
  const startSide = mobile ? 16 : vw * (vw <= 900 ? 0.1 : 0.22); // на планшете окно шире

  // Первые 65% прокрутки фото раскрывается
  const zoom = easeInOut(range(p, 0, 0.65));
  const s = heroStage.style;
  s.setProperty('--clip-top', `${lerp(startTop, 0, zoom)}px`);
  s.setProperty('--clip-bottom', `${lerp(startBottom, 0, zoom)}px`);
  s.setProperty('--clip-side', `${lerp(startSide, 0, zoom)}px`);
  s.setProperty('--clip-radius', `${lerp(28, 0, zoom)}px`);
  s.setProperty('--img-scale', lerp(1.3, 1, zoom).toFixed(4));

  // Строки заголовка разъезжаются в стороны и тают
  s.setProperty('--line-shift', `${zoom * vw * 0.55}px`);
  s.setProperty('--intro-opacity', (1 - range(p, 0.02, 0.26)).toFixed(3));

  // Плашки улетают вверх
  s.setProperty('--chip-opacity', (1 - range(p, 0, 0.22)).toFixed(3));
  s.setProperty('--chip-shift', `${-p * 700}px`);

  // Затемнение и финальный текст
  s.setProperty('--shade', range(p, 0.45, 0.8).toFixed(3));
  s.setProperty('--final-opacity', range(p, 0.6, 0.85).toFixed(3));
  s.setProperty('--final-shift', `${lerp(48, 0, easeOut(range(p, 0.6, 0.95)))}px`);
  s.setProperty('--hint-opacity', (1 - range(p, 0, 0.06)).toFixed(3));

  heroStage.classList.toggle('is-final', p > 0.75);
}

// --- Сцена 2: горизонтальная лента направлений ---
function updateDirections() {
  if (!dirPinned) return;
  const p = stickyProgress(dirSection);
  dirTrack.style.transform = `translate3d(${-p * dirDistance}px, 0, 0)`;
  dirBar.style.transform = `scaleX(${p})`;
  dirCurrent.textContent = String(Math.round(p * (dirCards.length - 1)) + 1).padStart(2, '0');

  // Фото внутри карточек слегка смещаются — эффект глубины
  const center = window.innerWidth / 2;
  dirCards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const offset = (rect.left + rect.width / 2 - center) / window.innerWidth;
    card.querySelector('img').style.transform = `translateX(${offset * -40}px) scale(1.12)`;
  });
}

// --- Сцена 3: слова манифеста загораются по одному ---
function updateManifest() {
  const rect = manifest.getBoundingClientRect();
  const p = clamp((window.innerHeight * 0.85 - rect.top) / (rect.height + window.innerHeight * 0.25));
  const lit = reducedMotion ? manifestWords.length : Math.floor(p * manifestWords.length);
  if (lit === manifestLit) return; // ничего не поменялось — не трогаем DOM
  manifestLit = lit;
  manifestWords.forEach((w, i) => w.classList.toggle('is-on', i < lit));
}

// --- Сцена 4: линия check-up рисуется, шаги загораются ---
function updateCheckup() {
  const lineRect = stepsLine.getBoundingClientRect();
  const trigger = window.innerHeight * 0.5; // линия «дорисовывается» до середины экрана
  stepsFill.style.transform = `scaleY(${clamp((trigger - lineRect.top) / lineRect.height)})`;

  let current = 0;
  steps.forEach((step, i) => {
    if (step.getBoundingClientRect().top < trigger) current = i;
  });
  if (current === activeStep) return;
  activeStep = current;

  steps.forEach((step, i) => {
    step.classList.toggle('is-active', i === current);
    step.classList.toggle('is-past', i < current);
  });
  // Показываем все фото до текущего: новое «выезжает» шторкой поверх старого
  checkupImages.forEach((img, i) => img.classList.toggle('is-shown', i <= current));
  checkupTime.textContent = steps[current].querySelector('.step__time').textContent.split(' ·')[0];
  checkupTime.classList.remove('is-changing');
  void checkupTime.offsetWidth; // перезапуск CSS-анимации
  checkupTime.classList.add('is-changing');
}

// --- Сцена 5: параллакс фото клиники ---
function updateParallax() {
  if (reducedMotion) return;
  const k = window.innerWidth <= 600 ? 0.5 : 1;
  parallaxItems.forEach(el => {
    // offsetTop не зависит от transform, поэтому нет «дёрганья»
    const parentTop = el.parentElement.getBoundingClientRect().top;
    const center = parentTop + el.offsetTop + el.offsetHeight / 2;
    const offset = center - window.innerHeight / 2;
    el.style.transform = `translate3d(0, ${offset * Number(el.dataset.speed) * k}px, 0)`;
  });
}

// --- Шапка и полоска прогресса ---
let menuOpen = false;
function updateHeader(scrollY) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  scrollProgressBar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  header.classList.toggle('is-scrolled', scrollY > 10);

  // Листаем вниз — шапка прячется, вверх — появляется
  if (!menuOpen) {
    if (scrollY > lastScrollY + 4 && scrollY > 300) header.classList.add('is-hidden');
    else if (scrollY < lastScrollY - 4) header.classList.remove('is-hidden');
  }
}

function updateScenes() {
  updateHero();
  updateDirections();
  updateManifest();
  updateCheckup();
  updateParallax();
}

// --- Бегущая строка: ускоряется и наклоняется от скорости прокрутки ---
let marqueeX = 0;
let marqueeSkew = 0;
let marqueeDirection = 1;
function updateMarquee() {
  if (reducedMotion) return;
  if (Math.abs(velocity) > 0.5) marqueeDirection = velocity > 0 ? 1 : -1;
  marqueeX -= (0.6 + Math.abs(velocity) * 0.35) * marqueeDirection;

  const half = marqueeTrack.scrollWidth / 2;
  if (marqueeX <= -half) marqueeX += half;
  if (marqueeX > 0) marqueeX -= half;

  marqueeSkew = lerp(marqueeSkew, clamp(velocity * -0.25, -10, 10), 0.1);
  marqueeTrack.style.transform = `translate3d(${marqueeX}px, 0, 0) skewX(${marqueeSkew}deg)`;
}

// --- Курсор: кружок догоняет мышь с задержкой ---
const cursor = document.getElementById('cursor');
const cursorLabel = document.getElementById('cursorLabel');
const hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const mouse = { x: -100, y: -100 };
const cursorPos = { x: -100, y: -100 };

if (hasMouse) {
  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    const target = e.target.closest('[data-cursor]');
    cursor.classList.toggle('is-big', Boolean(target));
    if (target) cursorLabel.textContent = target.dataset.cursor;
    cursor.classList.remove('is-hidden');
  });
  document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
}

function updateCursor() {
  if (!hasMouse) return;
  cursorPos.x = lerp(cursorPos.x, mouse.x, 0.18);
  cursorPos.y = lerp(cursorPos.y, mouse.y, 0.18);
  cursor.style.transform = `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)`;
}

// --- Один цикл на всё: работает ~60 раз в секунду ---
function loop() {
  const scrollY = window.scrollY;
  velocity = lerp(velocity, scrollY - lastScrollY, 0.2);

  if (scrollY !== lastScrollY || needsUpdate) {
    updateHeader(scrollY);
    updateScenes();
    needsUpdate = false;
  }
  lastScrollY = scrollY;

  updateMarquee();
  updateCursor();
  requestAnimationFrame(loop);
}

window.addEventListener('resize', measure);
window.addEventListener('load', measure); // после загрузки шрифтов и фото размеры точнее


// =========================================================
// 7. ПОЯВЛЕНИЕ ЭЛЕМЕНТОВ И СЧЁТЧИКИ
// =========================================================
function animateCounter(el) {
  const target = Number(el.dataset.count);
  const decimals = Number(el.dataset.decimals || 0);
  const format = n => n.toLocaleString('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  if (reducedMotion) { el.textContent = format(target); return; }

  const duration = 1800;
  const start = performance.now();
  function tick(now) {
    const t = clamp((now - start) / duration);
    el.textContent = format(target * easeOut(t));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    entry.target.querySelectorAll('[data-count]').forEach(animateCounter);
    revealObserver.unobserve(entry.target); // анимируем один раз
  });
}, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

document.querySelectorAll('[data-reveal], .doctor, #footerBig').forEach(el => revealObserver.observe(el));
document.querySelectorAll('#footerBig span').forEach((span, i) => span.style.setProperty('--i', i));


// =========================================================
// 8. МЕНЮ-БУРГЕР
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
// 9. ЦЕНЫ: вкладки и поиск
// =========================================================
const priceTabs = document.getElementById('priceTabs');
const priceList = document.getElementById('priceList');
const priceEmpty = document.getElementById('priceEmpty');
const priceSearch = document.getElementById('priceSearch');
let activeTab = 'all';

function renderTabs() {
  const tabs = [{ id: 'all', name: 'Все' }, ...directions];
  priceTabs.innerHTML = tabs.map(t => {
    const count = t.id === 'all' ? prices.length : prices.filter(p => p.dir === t.id).length;
    return `<button class="tab ${t.id === activeTab ? 'is-active' : ''}" data-tab="${t.id}" role="tab" aria-selected="${t.id === activeTab}">${t.name}<span class="tab__count">${count}</span></button>`;
  }).join('');
}

// Экранируем спецсимволы, чтобы «(» в поиске не сломала регулярное выражение
const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function renderPrices() {
  const query = priceSearch.value.trim().toLowerCase();
  // Если что-то ищут — ищем по всем услугам, а не только во вкладке
  const list = prices.filter(p =>
    query ? p.name.toLowerCase().includes(query) : activeTab === 'all' || p.dir === activeTab
  );

  priceEmpty.hidden = list.length > 0;
  priceList.hidden = list.length === 0;

  const highlight = name => query
    ? name.replace(new RegExp(`(${escapeRegExp(query)})`, 'gi'), '<mark>$1</mark>')
    : name;

  priceList.innerHTML = list.map((p, i) => `
    <li>
      <a href="#booking" class="price-row" data-direction="${p.dir}" style="--i: ${i}">
        <span class="price-row__name">${highlight(p.name)}<span class="price-row__cat">${findDirection(p.dir).name}</span></span>
        <span class="price-row__time">${p.time}</span>
        <span class="price-row__price">${p.from ? 'от ' : ''}${formatPrice(p.price)}</span>
        <span class="price-row__go" aria-hidden="true">→</span>
      </a>
    </li>`).join('');
}

priceTabs.addEventListener('click', e => {
  const btn = e.target.closest('[data-tab]');
  if (!btn) return;
  activeTab = btn.dataset.tab;
  priceSearch.value = '';
  renderTabs();
  renderPrices();
});

priceSearch.addEventListener('input', () => {
  if (priceSearch.value.trim()) activeTab = 'all';
  renderTabs();
  renderPrices();
});

document.getElementById('priceReset').addEventListener('click', () => {
  priceSearch.value = '';
  activeTab = 'all';
  renderTabs();
  renderPrices();
  priceSearch.focus();
});


// =========================================================
// 10. ЗАПИСЬ К ВРАЧУ: мастер из 4 шагов
// =========================================================
const wizard = {
  step: 1,
  dir: null,
  doc: null,
  date: null,
  time: null,
};

const panels = [...document.querySelectorAll('.wizard__panel')];
const wizardLabel = document.getElementById('wizardLabel');
const wizardBars = [...document.querySelectorAll('#wizardProgress span')];
const wizardBack = document.getElementById('wizardBack');
const wizardNext = document.getElementById('wizardNext');
const wizardNav = document.getElementById('wizardNav');
const optDirections = document.getElementById('optDirections');
const optDoctors = document.getElementById('optDoctors');
const optDates = document.getElementById('optDates');
const optSlots = document.getElementById('optSlots');
const bookingForm = document.getElementById('bookingForm');
const bookingError = document.getElementById('bookingError');

const STEP_NAMES = ['Направление', 'Врач', 'Дата и время', 'Контакты'];
let slotsTimer = null;

function goToStep(step, back = false) {
  wizard.step = step;
  panels.forEach(panel => {
    const isCurrent = Number(panel.dataset.step) === step;
    panel.hidden = !isCurrent;
    // перезапускаем анимацию появления панели (вперёд или назад)
    if (isCurrent) {
      panel.classList.toggle('is-back', back);
      panel.style.animation = 'none';
      void panel.offsetWidth;
      panel.style.animation = '';
    }
  });

  if (step === 5) {
    wizardLabel.textContent = 'Готово';
    wizardBars.forEach(b => b.classList.add('is-done'));
    wizardNav.hidden = true;
    return;
  }

  wizardNav.hidden = false;
  wizardLabel.textContent = `Шаг ${step} из 4 · ${STEP_NAMES[step - 1]}`;
  wizardBars.forEach((b, i) => b.classList.toggle('is-done', i < step));
  wizardBack.hidden = step === 1;

  if (step === 1) renderDirectionOptions();
  if (step === 2) renderDoctorOptions();
  if (step === 3) renderDates();
  if (step === 4) renderSummary();
  updateNextButton();
}

// Текст кнопки «Дальше» подсказывает, что нужно сделать
function updateNextButton() {
  const states = {
    1: wizard.dir ? ['Дальше: выбрать врача', true] : ['Выберите направление', false],
    2: wizard.doc ? ['Дальше: выбрать время', true] : ['Выберите врача', false],
    3: wizard.time ? ['Дальше: подтвердить', true] : ['Выберите время', false],
    4: [`Записаться на ${wizard.time}`, true],
  };
  const [text, enabled] = states[wizard.step];
  wizardNext.textContent = text;
  wizardNext.disabled = !enabled;
}

// Шаг 1
function renderDirectionOptions() {
  optDirections.innerHTML = directions.map(d => `
    <button class="option ${wizard.dir === d.id ? 'is-selected' : ''}" data-id="${d.id}">
      <strong>${d.name}</strong>
      <span>приём от ${formatPrice(d.price)}</span>
    </button>`).join('');
}
optDirections.addEventListener('click', e => {
  const btn = e.target.closest('.option');
  if (!btn) return;
  if (wizard.dir !== btn.dataset.id) { wizard.doc = null; wizard.time = null; }
  wizard.dir = btn.dataset.id;
  renderDirectionOptions();
  updateNextButton();
});

// Шаг 2
function renderDoctorOptions() {
  const list = doctors.filter(d => d.dir === wizard.dir);
  optDoctors.innerHTML = list.map(d => {
    const next = nextFreeSlot(d.id);
    const initials = d.name.split(' ').map(w => w[0]).join('').slice(0, 2);
    return `
      <button class="doc-option ${wizard.doc === d.id ? 'is-selected' : ''}" data-id="${d.id}">
        <span class="doc-option__avatar">${d.photo ? `<img src="${photoUrl(d.photo, 120, 120)}" alt="">` : d.room ? '✚' : initials}</span>
        <span class="doc-option__info">
          <span class="doc-option__name">${d.name}</span>
          <span class="doc-option__spec">${d.spec}${d.exp ? ` · стаж ${d.exp} лет` : ''}</span>
        </span>
        <span class="doc-option__next">${next ? `${humanDate(next.date)}<br>${next.time}` : ''}</span>
      </button>`;
  }).join('');
}
optDoctors.addEventListener('click', e => {
  const btn = e.target.closest('.doc-option');
  if (!btn) return;
  if (wizard.doc !== btn.dataset.id) wizard.time = null;
  wizard.doc = btn.dataset.id;
  wizard.date = null;
  renderDoctorOptions();
  updateNextButton();
});

// Шаг 3
function renderDates() {
  const days = getNextDays();
  // по умолчанию — ближайший день, когда у врача есть свободное время
  if (!wizard.date) {
    const next = nextFreeSlot(wizard.doc);
    wizard.date = next ? next.date : days[0];
  }
  optDates.innerHTML = days.map((d, i) => `
    <button class="date ${d.getDay() === 0 ? 'is-off' : ''} ${isSameDay(d, wizard.date) ? 'is-selected' : ''}" data-index="${i}">
      <span>${i === 0 ? 'сег' : DAY_SHORT[d.getDay()]}</span>
      <strong>${d.getDate()}</strong>
    </button>`).join('');
  renderSlots(true);
}

function renderSlots(withLoading) {
  clearTimeout(slotsTimer);

  // Состояние «загрузка»: показываем скелетон, как будто ждём сервер
  if (withLoading) {
    optSlots.innerHTML = Array(12).fill('<span class="slot slot--skeleton"></span>').join('');
    slotsTimer = setTimeout(() => renderSlots(false), 550);
    return;
  }

  const date = wizard.date;
  const slots = getSlots(wizard.doc, date);

  // Состояние «пусто»: выходной или всё занято
  if (!slots.some(s => s.free)) {
    const next = nextFreeSlot(wizard.doc);
    const title = date.getDay() === 0 ? 'В воскресенье клиника не работает' : 'На этот день свободного времени нет';
    optSlots.innerHTML = `
      <div class="slots__empty">
        <strong>${title}</strong>
        ${next ? `Ближайшее свободное время — ${humanDate(next.date)} в ${next.time}.
        <br><button type="button" data-jump="${dateKey(next.date)}" data-time="${next.time}">Выбрать это время</button>` : 'Позвоните нам — подберём время вручную.'}
      </div>`;
    return;
  }

  optSlots.innerHTML = slots.map(s => `
    <button class="slot ${wizard.time === s.time ? 'is-selected' : ''}" data-time="${s.time}" ${s.free ? '' : 'disabled aria-label="Занято"'}>${s.time}</button>
  `).join('');
}

optDates.addEventListener('click', e => {
  const btn = e.target.closest('.date');
  if (!btn) return;
  wizard.date = getNextDays()[Number(btn.dataset.index)];
  wizard.time = null;
  optDates.querySelectorAll('.date').forEach(d => d.classList.toggle('is-selected', d === btn));
  renderSlots(true);
  updateNextButton();
});

optSlots.addEventListener('click', e => {
  // «Выбрать это время» из пустого состояния
  const jump = e.target.closest('[data-jump]');
  if (jump) {
    wizard.date = getNextDays().find(d => dateKey(d) === jump.dataset.jump) || wizard.date;
    wizard.time = jump.dataset.time;
    renderDates();
    updateNextButton();
    return;
  }
  const btn = e.target.closest('.slot');
  if (!btn || btn.disabled || !btn.dataset.time) return;
  wizard.time = btn.dataset.time;
  optSlots.querySelectorAll('.slot').forEach(s => s.classList.toggle('is-selected', s === btn));
  updateNextButton();
});

// Шаг 4
function renderSummary() {
  const dir = findDirection(wizard.dir);
  const doc = findDoctor(wizard.doc);
  document.getElementById('summary').innerHTML = `
    <div class="summary__row"><span>Направление</span><strong>${dir.name}</strong></div>
    <div class="summary__row"><span>${doc.room ? 'Кабинет' : 'Врач'}</span><strong>${doc.name}</strong></div>
    <div class="summary__row"><span>Когда</span><strong>${humanDate(wizard.date)}, ${wizard.time}</strong></div>
    <div class="summary__row summary__row--total"><span>Стоимость</span><strong>от ${formatPrice(dir.price)}</strong></div>`;
}

// маска телефона: 89001234567 → +7 (900) 123-45-67
function formatPhone(value) {
  let digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (digits[0] === '8') digits = '7' + digits.slice(1);
  if (digits[0] !== '7') digits = '7' + digits;
  digits = digits.slice(0, 11);
  let result = '+7';
  if (digits.length > 1) result += ' (' + digits.slice(1, 4);
  if (digits.length >= 5) result += ') ' + digits.slice(4, 7);
  if (digits.length >= 8) result += '-' + digits.slice(7, 9);
  if (digits.length >= 10) result += '-' + digits.slice(9, 11);
  return result;
}

function setError(input, message) {
  const field = input.closest('.field');
  field.classList.toggle('has-error', Boolean(message));
  field.querySelector('.field__error').textContent = message;
}

function validateBooking() {
  const name = bookingForm.name;
  const phone = bookingForm.phone;
  const checks = [
    [name, name.value.trim().length < 2 ? 'Напишите имя — так администратор вас встретит' : ''],
    [phone, phone.value.replace(/\D/g, '').length !== 11 ? 'Введите номер полностью: +7 и 10 цифр' : ''],
  ];
  let firstInvalid = null;
  checks.forEach(([input, msg]) => {
    setError(input, msg);
    if (msg && !firstInvalid) firstInvalid = input;
  });
  if (firstInvalid) firstInvalid.focus();
  return !firstInvalid;
}

function sendBooking() {
  // ДЕМО: имитация отправки. В рабочем проекте здесь будет fetch на сервер клиники
  return new Promise((resolve, reject) => {
    setTimeout(() => (navigator.onLine ? resolve() : reject(new Error('offline'))), 1300);
  });
}

async function submitBooking() {
  bookingError.hidden = true;
  if (!validateBooking()) return;

  wizardNext.classList.add('is-loading');
  wizardNext.textContent = 'Записываем…';
  wizardBack.disabled = true;
  try {
    await sendBooking();
    const doc = findDoctor(wizard.doc);
    const name = bookingForm.name.value.trim().split(' ')[0];
    document.getElementById('doneText').textContent =
      `${name}, ждём вас ${humanDate(wizard.date)} в ${wizard.time}. ${doc.room ? doc.name : `Врач — ${doc.name}`}. ` +
      'Адрес: Набережная ул., 14. SMS-напоминание придёт за 2 часа до приёма.';
    goToStep(5);
  } catch {
    bookingError.textContent = 'Не получилось отправить запись — похоже, пропал интернет. Время пока держим за вами: нажмите кнопку ещё раз.';
    bookingError.hidden = false;
    updateNextButton();
  } finally {
    wizardNext.classList.remove('is-loading');
    wizardBack.disabled = false;
  }
}

wizardNext.addEventListener('click', () => {
  if (wizard.step === 4) submitBooking();
  else goToStep(wizard.step + 1);
});
wizardBack.addEventListener('click', () => goToStep(wizard.step - 1, true));

document.getElementById('wizardRestart').addEventListener('click', () => {
  Object.assign(wizard, { dir: null, doc: null, date: null, time: null });
  bookingForm.reset();
  goToStep(1, true);
});

bookingForm.phone.addEventListener('input', () => { bookingForm.phone.value = formatPhone(bookingForm.phone.value); });
bookingForm.querySelectorAll('input').forEach(input => input.addEventListener('input', () => setError(input, '')));
bookingForm.addEventListener('submit', e => { e.preventDefault(); submitBooking(); });

// Кнопки «Записаться» по всему сайту сразу настраивают мастер
document.addEventListener('click', e => {
  const doctorLink = e.target.closest('[data-doctor]');
  const directionLink = e.target.closest('[data-direction]');

  if (doctorLink) {
    const doc = findDoctor(doctorLink.dataset.doctor);
    Object.assign(wizard, { dir: doc.dir, doc: doc.id, date: null, time: null });
    goToStep(3);
  } else if (directionLink) {
    Object.assign(wizard, { dir: directionLink.dataset.direction, doc: null, date: null, time: null });
    goToStep(2);
  }
});


// =========================================================
// ЗАПУСК
// =========================================================
renderTabs();
renderPrices();
goToStep(1);
measure();
requestAnimationFrame(loop);
