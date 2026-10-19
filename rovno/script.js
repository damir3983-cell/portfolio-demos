// =========================================================
// 0. УТИЛИТЫ
// =========================================================
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;
const range = (p, start, end) => clamp((p - start) / (end - start)); // кусок прогресса → 0..1
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const money = n => Math.round(n).toLocaleString('ru-RU') + ' ₽';
// 1 день, 2 дня, 5 дней
const daysWord = n => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'день';
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'дня';
  return 'дней';
};
const photo = (id, w, h) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=72`;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function stickyProgress(section) {
  const rect = section.getBoundingClientRect();
  const distance = rect.height - window.innerHeight;
  return distance > 0 ? clamp(-rect.top / distance) : 0;
}


// =========================================================
// 1. ДАННЫЕ КАЛЬКУЛЯТОРА
// =========================================================
const flatTypes = {
  new:   { coef: 1,    note: 'Голые стены от застройщика — демонтаж не нужен.' },
  old:   { coef: 1.12, note: 'Включили демонтаж старой отделки и вывоз мусора — +12% к работам.' },
  house: { coef: 1.18, note: 'Учли перепады высот и больше инженерии — +18% к работам.' },
};

// rate — цена работ за м², days — база + дни на каждый м², mat — сколько черновых материалов нужно
const levels = [
  { id: 'cosmetic', name: 'Косметический',     rate: 4900,  daysBase: 18, daysPerM: 0.18, mat: 0.5, photo: '1599619585752-c3edb42a414c' },
  { id: 'capital',  name: 'Капитальный',       rate: 9800,  daysBase: 38, daysPerM: 0.38, mat: 1,   photo: '1517581177682-a085bb7ffb15' },
  { id: 'design',   name: 'С дизайн-проектом', rate: 15900, daysBase: 50, daysPerM: 0.5,  mat: 1.3, photo: '1729086046027-09979ade13fd' },
];

// perM — цена за м², perBath — за каждый санузел; includedIn — уже входит в этот уровень
const options = [
  { id: 'materials', name: 'Черновые материалы', note: 'закупим со скидкой до 15%', perM: 3600, kind: 'mat', checked: true },
  { id: 'electric',  name: 'Новая электрика',     note: '1 400 ₽/м²', perM: 1400 },
  { id: 'ceiling',   name: 'Натяжные потолки',    note: '950 ₽/м²',   perM: 950 },
  { id: 'floor',     name: 'Тёплый пол в санузлах', note: '38 000 ₽ за санузел', perBath: 38000 },
  { id: 'project',   name: 'Дизайн-проект',       note: '1 500 ₽/м², +14 дней', perM: 1500, days: 14, includedIn: 'design' },
  { id: 'cleaning',  name: 'Клининг после ремонта', note: '250 ₽/м²', perM: 250 },
];

const BATH_PRICE = 85000;     // работы по одному санузлу
const AREA_MIN = 20;
const AREA_MAX = 300;
const RANGE_MAX = 200;

const calc = {
  type: 'new',
  area: 54,
  baths: 1,
  level: 'capital',
  options: new Set(options.filter(o => o.checked).map(o => o.id)),
};

const cases = [
  { title: 'ЖК «Речной», 64 м²',           meta: 'Капитальный · 2 комнаты · 61 день', price: 1140000, tag: 'Смета не выросла', photo: '1724582586458-a51791349977' },
  { title: 'Кухня-гостиная, 42 м²',        meta: 'С дизайн-проектом · 54 дня',       price: 980000, tag: 'Сдали на 4 дня раньше', photo: '1600684388091-627109f3cd60' },
  { title: 'Санузел в сталинке, 6 м²',     meta: 'Капитальный · 18 дней',            price: 190000,  tag: 'Перенесли стояк', photo: '1763485956310-55f3c0e822d5' },
  { title: 'Студия в новостройке, 31 м²',  meta: 'Косметический · 24 дня',           price: 310000,  tag: 'Под сдачу в аренду', photo: '1705321963943-de94bb3f0dd3' },
  { title: 'Ванная с окном, 9 м²',         meta: 'С дизайн-проектом · 26 дней',      price: 320000,  tag: 'Тёплый пол', photo: '1781344334947-60c704bafd51' },
  { title: 'Трёшка на Садовой, 86 м²',     meta: 'Капитальный · 74 дня',             price: 1480000, tag: 'Смета не выросла', photo: '1741764014072-68953e93cd48' },
];


// =========================================================
// 2. ПЕРВЫЙ ЭКРАН: «было → стало»
// =========================================================
const header = document.getElementById('header');
const scrollBar = document.getElementById('scrollProgress');
const hero = document.querySelector('.hero');
const heroStage = document.getElementById('heroStage');
const heroPlan = document.getElementById('heroPlan');
const heroDaysNum = document.getElementById('heroDaysNum');
const heroDaysBar = document.getElementById('heroDaysBar');
const heroDaysLabel = document.getElementById('heroDaysLabel');
const TOTAL_DAYS = 58;

// Готовим линии плана к «рисованию»: длина пунктира = длина линии, сдвиг = длина (линия спрятана)
const planPaths = [...heroPlan.querySelectorAll('path')];
planPaths.forEach(path => {
  const len = path.getTotalLength();
  path.style.strokeDasharray = len;
  path.style.strokeDashoffset = len;
  path.dataset.len = len;
});

let lastDays = -1;
function updateHero() {
  const p = reducedMotion ? 1 : stickyProgress(hero);
  const vw = window.innerWidth;
  const vh = heroStage.clientHeight;
  const s = heroStage.style;

  // Фаза 1 (0–32%): чертим план — линии по очереди
  const draw = range(p, 0.02, 0.32);
  planPaths.forEach((path, i) => {
    const local = range(draw, i * 0.1, i * 0.1 + 0.45);
    path.style.strokeDashoffset = path.dataset.len * (1 - local);
  });
  heroPlan.classList.toggle('is-labeled', draw > 0.85);

  // Фаза 2 (38–90%): валик открывает готовый интерьер, план исчезает
  const sweep = easeInOut(range(p, 0.38, 0.9));
  s.setProperty('--sweep', sweep.toFixed(4));
  s.setProperty('--plan-opacity', (1 - range(p, 0.4, 0.58)).toFixed(3));
  s.setProperty('--roller-opacity', Math.min(range(sweep, 0, 0.04), 1 - range(sweep, 0.94, 1)).toFixed(3));
  // Наклон валика совпадает с наклоном края: край сдвигается на 25% ширины по всей высоте
  s.setProperty('--roller-angle', `${(Math.atan((vw * 0.25) / vh) * 180 / Math.PI).toFixed(2)}deg`);
  s.setProperty('--hint-opacity', (1 - range(p, 0, 0.05)).toFixed(3));

  // Счётчик дней идёт вместе с валиком
  const days = Math.round(sweep * TOTAL_DAYS);
  if (days !== lastDays) {
    lastDays = days;
    heroDaysNum.textContent = days;
    heroDaysLabel.textContent = days === 0 ? 'До ремонта' : days === TOTAL_DAYS ? 'Сдали в срок ✓' : 'Идёт ремонт';
  }
  heroDaysBar.style.transform = `scaleX(${sweep})`;
}


// =========================================================
// 3. СТОПКА КАРТОЧЕК ЭТАПОВ
// =========================================================
const stackCards = [...document.querySelectorAll('.stack__card')];
let stackTops = [];

function measureStack() {
  stackTops = stackCards.map(card => parseFloat(getComputedStyle(card).top) || 0);
}

function updateStack() {
  if (reducedMotion) return;
  // cover[k] — насколько карточка k уже наехала на предыдущую (0..1)
  const cover = stackCards.map((card, k) => {
    if (k === 0) return 0;
    const prev = stackCards[k - 1];
    const distance = card.getBoundingClientRect().top - stackTops[k - 1];
    return clamp(1 - distance / prev.offsetHeight);
  });
  stackCards.forEach((card, i) => {
    // глубина = сколько карточек лежит поверх этой
    let depth = 0;
    for (let k = i + 1; k < stackCards.length; k++) depth += cover[k];
    card.style.setProperty('--s', (1 - depth * 0.05).toFixed(4));
    card.style.setProperty('--b', (1 - Math.min(depth, 2) * 0.1).toFixed(3));
  });
}


// =========================================================
// 4. КАЛЬКУЛЯТОР
// =========================================================
const typeNote = document.getElementById('typeNote');
const areaInput = document.getElementById('areaInput');
const areaRange = document.getElementById('areaRange');
const areaError = document.getElementById('areaError');
const areaBox = areaInput.closest('.area-input');
const bathValue = document.getElementById('bathValue');
const bathMinus = document.getElementById('bathMinus');
const bathPlus = document.getElementById('bathPlus');
const levelsEl = document.getElementById('calcLevels');
const optionsEl = document.getElementById('calcOptions');

const resultMain = document.getElementById('resultMain');
const resultEmpty = document.getElementById('resultEmpty');
const leadForm = document.getElementById('leadForm');
const resultDone = document.getElementById('resultDone');

function levelDays(level) {
  return Math.round(level.daysBase + calc.area * level.daysPerM);
}

function renderLevels() {
  levelsEl.innerHTML = levels.map(l => `
    <button type="button" class="level ${calc.level === l.id ? 'is-selected' : ''}" data-level="${l.id}" aria-pressed="${calc.level === l.id}">
      <img src="${photo(l.photo, 480, 300)}" alt="" loading="lazy">
      <span class="level__body">
        <span class="level__name">${l.name}</span>
        <span class="level__price">от ${l.rate.toLocaleString('ru-RU')} ₽/м²</span>
        <span class="level__days">${calc.area >= AREA_MIN ? `≈ ${levelDays(l)} ${daysWord(levelDays(l))}` : 'сроки после расчёта'}</span>
      </span>
    </button>`).join('');
}

function renderOptions() {
  optionsEl.innerHTML = options.map(o => {
    const included = o.includedIn === calc.level;
    const checked = included || calc.options.has(o.id);
    return `
      <label class="opt ${included ? 'is-included' : ''}">
        <input type="checkbox" value="${o.id}" ${checked ? 'checked' : ''} ${included ? 'disabled' : ''}>
        <span class="opt__box" aria-hidden="true">✓</span>
        <span><span class="opt__name">${o.name}</span><span class="opt__price">${included ? 'уже входит в уровень' : o.note}</span></span>
      </label>`;
  }).join('');
}

// Главная формула
function compute() {
  const level = levels.find(l => l.id === calc.level);
  const type = flatTypes[calc.type];
  let works = calc.area * level.rate * type.coef + calc.baths * BATH_PRICE;
  let materials = 0;
  let extra = 0;
  let days = levelDays(level) + (calc.baths - 1) * 6;

  options.forEach(o => {
    if (o.includedIn === calc.level || !calc.options.has(o.id)) return;
    const cost = (o.perM || 0) * calc.area + (o.perBath || 0) * calc.baths;
    if (o.kind === 'mat') materials += cost * level.mat;
    else extra += cost;
    days += o.days || 0;
  });

  // округляем до тысячи — так честнее при точности ±7%
  works = Math.round(works / 1000) * 1000;
  materials = Math.round(materials / 1000) * 1000;
  extra = Math.round(extra / 1000) * 1000;
  const total = works + materials + extra;
  return { works, materials, extra, total, days, perM: total / calc.area };
}

// Плавная смена чисел
const shown = { total: 0, perM: 0, days: 0, works: 0, materials: 0, extra: 0, pay: 0 };
let tweenFrame = null;
function tweenTo(target) {
  cancelAnimationFrame(tweenFrame);
  const from = { ...shown };
  const start = performance.now();
  const duration = reducedMotion ? 1 : 550;
  resultMain.classList.add('is-updating');

  function frame(now) {
    const t = easeOut(clamp((now - start) / duration));
    Object.keys(target).forEach(key => { shown[key] = lerp(from[key], target[key], t); });
    document.getElementById('resTotal').textContent = Math.round(shown.total).toLocaleString('ru-RU');
    document.getElementById('resPerM').textContent = Math.round(shown.perM).toLocaleString('ru-RU');
    const d = Math.round(shown.days);
    document.getElementById('resDays').textContent = `${d} ${daysWord(d)}`;
    document.getElementById('resWork').textContent = money(shown.works);
    document.getElementById('resMat').textContent = money(shown.materials);
    document.getElementById('resOpt').textContent = money(shown.extra);
    document.getElementById('resPay').textContent = money(shown.pay);
    document.getElementById('calcBarTotal').textContent = money(shown.total);
    if (t < 1) tweenFrame = requestAnimationFrame(frame);
    else resultMain.classList.remove('is-updating');
  }
  tweenFrame = requestAnimationFrame(frame);
}

let lastResult = null;
function updateCalc() {
  const valid = Number.isFinite(calc.area) && calc.area >= AREA_MIN && calc.area <= AREA_MAX;

  // Состояние «нет данных»: площадь не указана или вне диапазона
  areaBox.classList.toggle('has-error', !valid);
  areaError.textContent = valid ? '' :
    calc.area > AREA_MAX ? 'Больше 300 м² считаем индивидуально — оставьте заявку, инженер приедет на замер.' :
    `Укажите площадь от ${AREA_MIN} до ${AREA_MAX} м²`;

  if (!valid) {
    resultMain.hidden = true;
    leadForm.hidden = true;
    resultDone.hidden = true;
    resultEmpty.hidden = false;
    renderLevels();
    return;
  }
  resultEmpty.hidden = true;
  if (leadForm.hidden && resultDone.hidden) resultMain.hidden = false;

  const r = compute();
  lastResult = r;
  tweenTo({ ...r, pay: r.total / 5 });

  // Полоска состава сметы
  document.getElementById('barWork').style.flexGrow = r.works;
  document.getElementById('barMat').style.flexGrow = r.materials;
  document.getElementById('barOpt').style.flexGrow = r.extra;

  // Заливка ползунка до текущего значения
  const fill = ((Math.min(calc.area, RANGE_MAX) - AREA_MIN) / (RANGE_MAX - AREA_MIN)) * 100;
  areaRange.style.setProperty('--fill', `${fill}%`);

  renderLevels();
  updateLeadSummary();
}

// --- События калькулятора ---
document.getElementById('calcType').addEventListener('change', e => {
  calc.type = e.target.value;
  typeNote.textContent = flatTypes[calc.type].note;
  updateCalc();
});

areaRange.addEventListener('input', () => {
  calc.area = Number(areaRange.value);
  areaInput.value = calc.area;
  updateCalc();
});

areaInput.addEventListener('input', () => {
  calc.area = areaInput.value === '' ? NaN : Number(areaInput.value);
  if (Number.isFinite(calc.area)) areaRange.value = clamp(calc.area, AREA_MIN, RANGE_MAX);
  updateCalc();
});

document.getElementById('resetArea').addEventListener('click', () => {
  calc.area = 54;
  areaInput.value = 54;
  areaRange.value = 54;
  updateCalc();
  areaInput.focus();
});

function renderBaths() {
  bathValue.textContent = calc.baths;
  bathMinus.disabled = calc.baths <= 1;
  bathPlus.disabled = calc.baths >= 4;
}
bathMinus.addEventListener('click', () => { calc.baths--; renderBaths(); updateCalc(); });
bathPlus.addEventListener('click', () => { calc.baths++; renderBaths(); updateCalc(); });

levelsEl.addEventListener('click', e => {
  const btn = e.target.closest('[data-level]');
  if (!btn) return;
  calc.level = btn.dataset.level;
  renderOptions();
  updateCalc();
});

optionsEl.addEventListener('change', e => {
  const id = e.target.value;
  if (e.target.checked) calc.options.add(id);
  else calc.options.delete(id);
  updateCalc();
});


// =========================================================
// 5. ЗАЯВКА ИЗ КАЛЬКУЛЯТОРА
// =========================================================
const leadSubmit = document.getElementById('leadSubmit');
const leadError = document.getElementById('leadError');

function updateLeadSummary() {
  if (!lastResult) return;
  const level = levels.find(l => l.id === calc.level);
  document.getElementById('leadSummary').textContent =
    `${calc.area} м² · ${level.name.toLowerCase()} · ${money(lastResult.total)} · ${lastResult.days} ${daysWord(lastResult.days)}`;
}

document.getElementById('resCta').addEventListener('click', () => {
  resultMain.hidden = true;
  leadForm.hidden = false;
  leadForm.name.focus();
});
document.getElementById('leadBack').addEventListener('click', () => {
  leadForm.hidden = true;
  resultMain.hidden = false;
});
document.getElementById('doneBack').addEventListener('click', () => {
  resultDone.hidden = true;
  resultMain.hidden = false;
  leadForm.reset();
});

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

function validateLead() {
  const checks = [
    [leadForm.name, leadForm.name.value.trim().length < 2 ? 'Напишите имя — так инженер к вам обратится' : ''],
    [leadForm.phone, leadForm.phone.value.replace(/\D/g, '').length !== 11 ? 'Нужен номер полностью: +7 и 10 цифр' : ''],
  ];
  let first = null;
  checks.forEach(([input, msg]) => {
    setError(input, msg);
    if (msg && !first) first = input;
  });
  if (first) first.focus();
  return !first;
}

function sendLead() {
  // ДЕМО: имитация отправки. В рабочем проекте — fetch('send.php', { method: 'POST', body: new FormData(leadForm) })
  return new Promise((resolve, reject) => {
    setTimeout(() => (navigator.onLine ? resolve() : reject(new Error('offline'))), 1200);
  });
}

leadForm.addEventListener('submit', async e => {
  e.preventDefault();
  leadError.hidden = true;
  if (!validateLead()) return;

  leadSubmit.classList.add('is-loading');
  leadSubmit.textContent = 'Отправляем…';
  try {
    await sendLead();
    const via = leadForm.via.value;
    const name = leadForm.name.value.trim();
    document.getElementById('doneText').textContent = via === 'звонок'
      ? `${name}, инженер позвонит в течение 30 минут: обсудит смету на ${money(lastResult.total)} и время бесплатного замера.`
      : `${name}, смета на ${money(lastResult.total)} придёт в ${via} в течение 30 минут. Инженер напишет, чтобы назначить бесплатный замер.`;
    leadForm.hidden = true;
    resultDone.hidden = false;
  } catch {
    leadError.textContent = 'Не удалось отправить — похоже, пропал интернет. Данные сохранены, нажмите кнопку ещё раз.';
    leadError.hidden = false;
  } finally {
    leadSubmit.classList.remove('is-loading');
    leadSubmit.textContent = 'Получить смету';
  }
});

leadForm.phone.addEventListener('input', () => { leadForm.phone.value = formatPhone(leadForm.phone.value); });
leadForm.querySelectorAll('.field input').forEach(i => i.addEventListener('input', () => setError(i, '')));


// =========================================================
// 6. КАРУСЕЛЬ ОБЪЕКТОВ: перетаскивание мышкой с инерцией
// =========================================================
const casesViewport = document.getElementById('casesViewport');
const casesTrack = document.getElementById('casesTrack');
const casesProgress = document.getElementById('casesProgress');
const casesPrev = document.getElementById('casesPrev');
const casesNext = document.getElementById('casesNext');

casesTrack.innerHTML = cases.map(c => `
  <article class="case">
    <div class="case__img">
      <img src="${photo(c.photo, 920, 690)}" alt="${c.title}" loading="lazy" draggable="false">
      <span class="case__tag">${c.tag}</span>
    </div>
    <h3 class="case__title">${c.title}</h3>
    <p class="case__meta">${c.meta}</p>
    <p class="case__price">${money(c.price)}</p>
  </article>`).join('');

function updateCasesUI() {
  const max = casesViewport.scrollWidth - casesViewport.clientWidth;
  const p = max > 0 ? casesViewport.scrollLeft / max : 0;
  casesProgress.style.transform = `scaleX(${0.15 + p * 0.85})`;
  casesPrev.disabled = casesViewport.scrollLeft <= 2;
  casesNext.disabled = casesViewport.scrollLeft >= max - 2;
}
casesViewport.addEventListener('scroll', updateCasesUI, { passive: true });

const cardStep = () => casesTrack.children[0].offsetWidth + 24;
casesPrev.addEventListener('click', () => casesViewport.scrollBy({ left: -cardStep(), behavior: 'smooth' }));
casesNext.addEventListener('click', () => casesViewport.scrollBy({ left: cardStep(), behavior: 'smooth' }));

// Перетаскивание (только мышь — на телефоне и так листается пальцем)
let drag = null;
let inertia = 0;
let inertiaFrame = null;

casesViewport.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'mouse' || e.button !== 0) return;
  cancelAnimationFrame(inertiaFrame);
  drag = { startX: e.clientX, startScroll: casesViewport.scrollLeft, lastX: e.clientX, moved: false };
  inertia = 0;
});

window.addEventListener('pointermove', e => {
  if (!drag) return;
  const dx = e.clientX - drag.startX;
  if (Math.abs(dx) > 5 && !drag.moved) {
    drag.moved = true;
    casesViewport.classList.add('is-dragging');
  }
  inertia = e.clientX - drag.lastX; // скорость последнего движения
  drag.lastX = e.clientX;
  casesViewport.scrollLeft = drag.startScroll - dx;
});

window.addEventListener('pointerup', () => {
  if (!drag) return;
  drag = null;
  casesViewport.classList.remove('is-dragging');
  // Инерция: лента продолжает ехать и плавно тормозит
  function glide() {
    if (Math.abs(inertia) < 0.5 || reducedMotion) return;
    casesViewport.scrollLeft -= inertia;
    inertia *= 0.94;
    inertiaFrame = requestAnimationFrame(glide);
  }
  glide();
});


// --- Плашка с итогом на телефоне: видна, пока форма на экране, а сам итог — нет ---
const calcBar = document.getElementById('calcBar');
const calcForm = document.querySelector('.calc__form');
const resultBox = document.getElementById('result');
function updateCalcBar() {
  if (window.innerWidth > 1100) return;
  const vh = window.innerHeight;
  const form = calcForm.getBoundingClientRect();
  const res = resultBox.getBoundingClientRect();
  const show = form.top < vh * 0.6 && form.bottom > vh * 0.3 && res.top > vh && resultEmpty.hidden;
  calcBar.classList.toggle('is-visible', show);
}


// =========================================================
// 7. ПОДВАЛ: слово выравнивается по уровню
// =========================================================
const footerLevel = document.getElementById('footerLevel');
function updateFooter() {
  const rect = footerLevel.getBoundingClientRect();
  const p = reducedMotion ? 1 : clamp((window.innerHeight - rect.top) / rect.height);
  const t = easeOut(p);
  footerLevel.style.setProperty('--tilt', `${lerp(-6, 0, t).toFixed(3)}deg`);
  footerLevel.style.setProperty('--bubble', `${lerp(-60, 0, t).toFixed(2)}px`);
  footerLevel.classList.toggle('is-level', p > 0.97);
}


// =========================================================
// 8. ШАПКА, КУРСОР, ГЛАВНЫЙ ЦИКЛ
// =========================================================
let menuOpen = false;
let lastScrollY = window.scrollY;

function updateHeader(y) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  scrollBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  // над тёмным первым экраном шапка прозрачная и светлая
  header.classList.toggle('is-solid', hero.getBoundingClientRect().bottom <= header.offsetHeight);
  if (menuOpen) return;
  if (y > lastScrollY + 4 && y > 300) header.classList.add('is-hidden');
  else if (y < lastScrollY - 4) header.classList.remove('is-hidden');
}

const cursor = document.getElementById('cursor');
const cursorLabel = document.getElementById('cursorLabel');
const mouse = { x: -100, y: -100 };
const cursorPos = { x: -100, y: -100 };
if (hasMouse) {
  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    const target = e.target.closest('[data-cursor]');
    cursor.classList.toggle('is-big', Boolean(target));
    if (target) cursorLabel.textContent = drag && drag.moved ? '←  →' : target.dataset.cursor;
    cursor.classList.remove('is-hidden');
  });
  document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
}

let needsUpdate = true;
function loop() {
  const y = window.scrollY;
  if (y !== lastScrollY || needsUpdate) {
    // при прокрутке под неподвижной мышкой оказывается другой элемент — обновляем курсор
    if (hasMouse && !drag) {
      const under = document.elementFromPoint(mouse.x, mouse.y);
      const target = under && under.closest('[data-cursor]');
      cursor.classList.toggle('is-big', Boolean(target));
      if (target) cursorLabel.textContent = target.dataset.cursor;
    }
    updateHeader(y);
    updateHero();
    updateStack();
    updateFooter();
    updateCalcBar();
    needsUpdate = false;
  }
  lastScrollY = y;

  if (hasMouse) {
    cursorPos.x = lerp(cursorPos.x, mouse.x, 0.22);
    cursorPos.y = lerp(cursorPos.y, mouse.y, 0.22);
    cursor.style.transform = `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)`;
  }
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  measureStack();
  updateCasesUI();
  needsUpdate = true;
});


// =========================================================
// 9. ПОЯВЛЕНИЕ, СЧЁТЧИКИ, МАСКИ СТРОК
// =========================================================
function animateCounter(el) {
  const target = Number(el.dataset.count);
  if (reducedMotion || target === 0) { el.textContent = target; return; }
  const start = performance.now();
  function tick(now) {
    const t = clamp((now - start) / 1600);
    el.textContent = Math.round(target * easeOut(t)).toLocaleString('ru-RU');
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

document.querySelectorAll('[data-lines] .mask > span').forEach((span, i) => span.style.setProperty('--l', i));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    entry.target.querySelectorAll('[data-count]').forEach(animateCounter);
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('[data-reveal], [data-lines]').forEach(el => revealObserver.observe(el));


// =========================================================
// 10. МЕНЮ-БУРГЕР
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
// ЗАПУСК
// =========================================================
renderBaths();
renderOptions();
updateCalc();
updateCasesUI();
measureStack();
requestAnimationFrame(loop);
