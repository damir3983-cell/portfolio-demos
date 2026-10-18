// =====================================================================
// main.js — общее для всех страниц:
// меню, горы на главной, волны в заголовках, окно заказа, уведомления
// =====================================================================

// ===== 1. БУРГЕР-МЕНЮ =====
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
if (burger) {
  burger.addEventListener('click', () => {
    burger.classList.toggle('is-open');
    nav.classList.toggle('is-open');
  });
}

// ===== 2. УВЕДОМЛЕНИЕ (toast) =====
// Создаём элемент один раз и переиспользуем
const toastEl = document.createElement('div');
toastEl.className = 'toast';
document.body.append(toastEl);
let toastTimer;
function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-show'), 2200);
}

// ===== 3. ОКНО ЗАКАЗА =====
// Разметку окна добавляем через JS, чтобы не копировать её в каждый HTML
const modal = document.createElement('div');
modal.className = 'modal';
modal.innerHTML = `
  <div class="modal__box">
    <button class="modal__close" aria-label="Закрыть">✕</button>
    <form class="form" id="orderForm">
      <h3>Оформить заказ</h3>
      <p class="modal__sub" id="orderSub"></p>
      <label class="field">Имя<input type="text" name="name" required></label>
      <label class="field">Телефон<input type="tel" name="phone" placeholder="+7 (___) ___-__-__" required></label>
      <label class="field">Комментарий<textarea name="comment" placeholder="Например: нужна установка Windows"></textarea></label>
      <button class="btn btn--lime btn--full" type="submit">Отправить заявку</button>
    </form>
    <div class="modal__done" id="orderDone">
      <b>✓</b>
      <h3>Заявка принята</h3>
      <p>Менеджер перезвонит в течение 15 минут и уточнит детали сборки.</p>
    </div>
  </div>`;
document.body.append(modal);

const orderForm = modal.querySelector('#orderForm');
const orderDone = modal.querySelector('#orderDone');

// Открыть окно. text — что заказывают (название и цена)
function openOrder(text) {
  modal.querySelector('#orderSub').textContent = text;
  orderForm.style.display = 'flex';
  orderDone.style.display = 'none';
  modal.classList.add('is-open');
}
function closeOrder() { modal.classList.remove('is-open'); }

modal.querySelector('.modal__close').addEventListener('click', closeOrder);
// Клик по тёмному фону (мимо окна) тоже закрывает
modal.addEventListener('click', (e) => { if (e.target === modal) closeOrder(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeOrder(); });

orderForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(orderForm));
  console.log('Заявка:', data, modal.querySelector('#orderSub').textContent);
  orderForm.reset();
  orderForm.style.display = 'none';
  orderDone.style.display = 'block';
});

// Любая кнопка с data-order="..." открывает окно заказа
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-order]');
  if (btn) openOrder(btn.dataset.order);
});

// ===== 4. ПОЯВЛЕНИЕ БЛОКОВ ПРИ ПРОКРУТКЕ =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

// Функция, а не разовый вызов: каталог перерисовывает карточки и вызывает её снова
function observeReveal(root = document) {
  root.querySelectorAll('.reveal:not(.is-visible)').forEach((el, i) => {
    el.style.transitionDelay = (i % 3) * 0.08 + 's';
    revealObserver.observe(el);
  });
}
observeReveal();

// ===== 5. ВОЛНЫ В ПОЛОСАХ-ЗАГОЛОВКАХ =====
// В каждый .band добавляем SVG с пачкой волнистых линий
document.querySelectorAll('.band').forEach((band, bandIndex) => {
  const W = 1200, H = 300;
  let paths = '';
  for (let i = 0; i < 34; i++) {
    const base = 30 + i * 8;                // каждая линия чуть ниже предыдущей
    const amp = 40 + Math.sin(i * 0.4) * 25; // высота волны
    const shift = bandIndex * 1.7 + i * 0.12;
    let d = '';
    // Строим линию из 60 точек по синусоиде
    for (let x = 0; x <= W; x += 20) {
      const y = base + Math.sin(x / 180 + shift) * amp + Math.sin(x / 70 + i) * 6;
      d += (x === 0 ? 'M' : 'L') + x + ',' + y.toFixed(1) + ' ';
    }
    const opacity = (0.04 + (i % 5) * 0.025).toFixed(3);
    paths += `<path d="${d}" fill="none" stroke="rgba(202,255,51,${opacity})" stroke-width="1"/>`;
  }
  const svg = `<svg class="band__waves" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${paths}</svg>`;
  band.insertAdjacentHTML('afterbegin', svg);
});

// ===== 6. "ПРОВОЛОЧНЫЕ" ГОРЫ НА ГЛАВНОЙ =====
// Рисуем сетку точек, поднимаем их по формуле "гор" и проецируем в 3D
const canvas = document.getElementById('terrain');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const COLS = 70, ROWS = 32;
  let width, height;

  // Подгоняем размер холста под экран (×dpr — чтобы на ретине было чётко)
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // Высота горы в точке (x, z) в момент t
  function mountain(x, z, t) {
    const peak = (px, pz, h, sx, sz) => h * Math.exp(-((x - px) ** 2 / sx + (z - pz) ** 2 / sz));
    return peak(0, 5, 2.4, 1.1, 1.6)
      + peak(-2.2, 5.6, 1.6, 0.8, 1.2)
      + peak(2.4, 5.4, 1.7, 0.9, 1.1)
      + peak(-4.5, 6.5, 1.1, 1.5, 1.5)
      + peak(4.6, 6.4, 1.2, 1.5, 1.5)
      + 0.12 * Math.sin(x * 3 + t) * Math.cos(z * 2.2 - t * 0.7);  // мелкая "рябь"
  }

  // Перевод 3D-точки в координаты на экране (простая перспектива)
  function project(x, y, z) {
    const f = width * 0.42;            // "фокусное расстояние"
    const horizon = height * 0.3;
    return [width / 2 + (x / z) * f, horizon + ((1.4 - y) / z) * f];
  }

  function draw(time) {
    const t = time / 2000;
    ctx.clearRect(0, 0, width, height);

    // Считаем все точки сетки
    const pts = [];
    for (let r = 0; r < ROWS; r++) {
      const z = 9 - r * 0.24;            // от дальнего ряда к ближнему
      const row = [];
      for (let c = 0; c < COLS; c++) {
        const x = -8 + (c / (COLS - 1)) * 16;
        row.push(project(x, mountain(x, z, t), z));
      }
      pts.push(row);
    }

    ctx.lineWidth = 1;
    // Горизонтальные линии (вдоль x)
    for (let r = 0; r < ROWS; r++) {
      ctx.strokeStyle = `rgba(202, 255, 51, ${0.05 + (r / ROWS) * 0.22})`; // ближе — ярче
      ctx.beginPath();
      pts[r].forEach(([px, py], c) => (c ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.stroke();
    }
    // Вертикальные линии (вдоль z)
    ctx.strokeStyle = 'rgba(202, 255, 51, 0.08)';
    for (let c = 0; c < COLS; c += 2) {
      ctx.beginPath();
      for (let r = 0; r < ROWS; r++) {
        const [px, py] = pts[r][c];
        r ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
    }
    // Следующий кадр. Если человек отключил анимации — рисуем один статичный кадр
    if (!reducedMotion) requestAnimationFrame(draw);
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(draw);
}

// ===== 7. КАРТОЧКА СБОРКИ (используют главная и каталог) =====
function pcCardHTML(preset) {
  const build = resolveBuild(preset.parts);
  const price = buildPrice(build);
  const cp = calcFps(build, GAMES.find(g => g.id === 'cyberpunk'), '1440').fps;
  return `
    <article class="pc-card reveal">
      <div class="pc-card__img">
        <img src="${img(preset.img, 800)}" alt="${preset.name}" loading="lazy" onerror="this.remove()">
        <span class="tag">${preset.tag}</span>
        <div class="pc-card__fps"><b>${cp}</b> FPS · Cyberpunk 2077, 1440p</div>
      </div>
      <div class="pc-card__body">
        <h3>${preset.name}</h3>
        <p class="pc-card__desc">${preset.desc}</p>
        <ul class="specs">
          <li><span>Процессор</span><b>${build.cpu.name}</b></li>
          <li><span>Видеокарта</span><b>${build.gpu.name} ${build.gpu.spec.split(' ')[0]} ГБ</b></li>
          <li><span>Память</span><b>${build.ram.name}</b></li>
          <li><span>Накопитель</span><b>${build.ssd.name.replace('SSD ', '')}</b></li>
        </ul>
        <div class="pc-card__foot">
          <div class="price">${formatPrice(price)}<small>с работой и тестами</small></div>
          <div class="pc-card__buttons">
            <a class="btn btn--dark btn--sm" href="configurator.html?preset=${preset.id}">Изменить</a>
            <button class="btn btn--lime btn--sm" data-order="${preset.name} — ${formatPrice(price)}">Купить</button>
          </div>
        </div>
      </div>
    </article>`;
}

// ===== 8. ДЕТАЛИ ПО БОКАМ: видеокарта слева, процессор справа =====
// Рисуем их как технический чертёж: контур, размерные линии, подписи.
// Видны только на широких экранах, где по бокам от рамки есть пустое место (см. CSS)

// Лопасти одного вентилятора: 8 изогнутых линий вокруг центра (0, 0)
function fanBlades() {
  let d = '';
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;               // 45° между лопастями
    const p = (r, da) => `${(r * Math.cos(a + da)).toFixed(1)},${(r * Math.sin(a + da)).toFixed(1)}`;
    d += `M${p(17, 0)} Q${p(42, 0.55)} ${p(56, 0.25)} `;
  }
  return d;
}

function gpuSVG() {
  const fans = [115, 265, 415].map((y, i) => `
    <g transform="translate(90 ${y})">
      <circle r="62" class="dim"/>
      <circle r="58"/>
      <g class="decor__fan" style="animation-duration:${6 + i}s"><path d="${fanBlades()}"/><circle r="17"/></g>
      <circle r="5" class="fill"/>
    </g>`).join('');

  // "Золотые" контакты PCIe справа: короткие полоски
  let pcie = '';
  for (let y = 300; y < 440; y += 8) pcie += `M162,${y} h12 `;

  return `
  <svg viewBox="0 0 200 560" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
    <rect x="14" y="2" width="152" height="9" rx="2"/>                 <!-- планка -->
    <rect x="20" y="12" width="140" height="500" rx="14"/>             <!-- корпус -->
    <rect x="28" y="20" width="124" height="484" rx="10" class="dim"/> <!-- кожух -->
    ${fans}
    <path d="${pcie}" class="dim"/>                                     <!-- PCIe -->
    <rect x="160" y="296" width="16" height="148" rx="2"/>
    <rect x="62" y="512" width="56" height="10" rx="2"/>               <!-- разъём питания -->
    <!-- размерная линия слева -->
    <path d="M6,12 V512 M2,12 h8 M2,512 h8" class="dim"/>
    <text x="0" y="0" transform="translate(4 300) rotate(-90)" class="label">304 mm</text>
    <text x="100" y="548" text-anchor="middle" class="label">GPU · 3 FAN · 16 GB</text>
  </svg>`;
}

function cpuSVG() {
  // Контакты по периметру подложки
  let pins = '';
  for (let i = 0; i < 14; i++) {
    const t = 32 + i * 12;
    pins += `M${t},20 v-8 M${t},200 v8 M20,${t} h-8 M200,${t} h8 `;
  }
  // Дорожки от процессора наружу, как на плате; по ним бегут "сигналы"
  const traces = [
    'M110,208 V240 H40 V300', 'M150,208 V230 H190 V300', 'M70,208 V222 H20 V270',
    'M208,80 H235 V20', 'M12,140 H-15 V60',
  ];
  const traceSvg = traces.map((d, i) => `
    <path d="${d}" class="dim"/>
    <path d="${d}" class="decor__signal" style="animation-delay:${i * 0.7}s"/>`).join('');

  return `
  <svg viewBox="-20 0 260 330" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
    ${traceSvg}
    <path d="${pins}" class="dim"/>
    <rect x="20" y="20" width="180" height="180" rx="10"/>             <!-- подложка -->
    <rect x="45" y="45" width="130" height="130" rx="8"/>              <!-- крышка -->
    <rect x="52" y="52" width="116" height="116" rx="5" class="dim"/>
    <path d="M30,30 l12,0 l-12,12 z" class="fill"/>                    <!-- метка ключа -->
    <text x="110" y="104" text-anchor="middle" class="title">RIG</text>
    <text x="110" y="124" text-anchor="middle" class="label">X-9000 · 8C/16T</text>
    <!-- размерная линия снизу -->
    <path d="M20,316 H200 M20,312 v8 M200,312 v8" class="dim"/>
    <text x="110" y="310" text-anchor="middle" class="label">45 × 45 mm</text>
  </svg>`;
}

// Вставляем обе детали в страницу
const decorLeft = document.createElement('div');
decorLeft.className = 'decor decor--left';
decorLeft.innerHTML = gpuSVG();
const decorRight = document.createElement('div');
decorRight.className = 'decor decor--right';
decorRight.innerHTML = cpuSVG();
document.body.append(decorLeft, decorRight);

// Параллакс: при прокрутке детали чуть сдвигаются в разные стороны
window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - innerHeight || 1;
  const p = scrollY / max;                       // от 0 до 1
  decorLeft.style.setProperty('--shift', (p * 60 - 30) + 'px');
  decorRight.style.setProperty('--shift', (30 - p * 60) + 'px');
}, { passive: true });

// ===== 9. СВЕТ ОТ КУРСОРА =====
// Только для мыши: на телефоне курсора нет
if (window.matchMedia('(pointer: fine)').matches) {
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.append(glow);

  let targetX = innerWidth / 2, targetY = innerHeight / 2;  // куда тянемся
  let x = targetX, y = targetY;                              // где сейчас
  let running = false;

  function follow() {
    // Каждый кадр проходим 15% оставшегося пути — так свет плавно "догоняет" курсор
    x += (targetX - x) * 0.15;
    y += (targetY - y) * 0.15;
    glow.style.transform = `translate(${x}px, ${y}px)`;

    // Детали по бокам разгораются, когда курсор рядом
    [decorLeft, decorRight].forEach(el => {
      const r = el.getBoundingClientRect();
      const dist = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
      el.style.setProperty('--near', Math.max(0, 1 - dist / 450).toFixed(2));
    });

    // Почти догнали — останавливаем цикл, чтобы не грузить процессор зря
    if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.5) requestAnimationFrame(follow);
    else running = false;
  }

  document.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    glow.classList.add('is-on');
    if (!running) { running = true; requestAnimationFrame(follow); }
  });
  // Мышь ушла за пределы окна — гасим свет
  document.addEventListener('mouseleave', () => glow.classList.remove('is-on'));
}
