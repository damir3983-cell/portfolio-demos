// =====================================================================
// configurator.js — выбор деталей, расчёт FPS, совместимость, итог
// =====================================================================

const DEFAULT_PRESET = 'pro';

// ===== 1. С ЧЕГО НАЧИНАЕМ =====
// Приоритет: ссылка (?preset=... или ?cpu=...&gpu=...) → сохранённая сборка → сборка по умолчанию
function loadInitialBuild() {
  const params = new URLSearchParams(location.search);
  const base = { ...PRESETS.find(p => p.id === DEFAULT_PRESET).parts };

  // ?preset=titan — пришли из каталога по кнопке "Изменить"
  const preset = PRESETS.find(p => p.id === params.get('preset'));
  if (preset) return { ...preset.parts };

  // ?cpu=...&gpu=... — кто-то поделился ссылкой на сборку
  if (params.has('cpu')) {
    for (const cat of CATEGORIES) {
      const id = params.get(cat.key);
      if (id && getPart(cat.key, id)) base[cat.key] = id; // берём только существующие детали
    }
    return base;
  }

  // Сохранённая в браузере сборка (try — localStorage может быть недоступен)
  try {
    const saved = JSON.parse(localStorage.getItem('rigup-build'));
    if (saved && CATEGORIES.every(c => getPart(c.key, saved[c.key]))) return saved;
  } catch (e) {}

  return base;
}

// Состояние: id выбранной детали в каждой категории
let selected = loadInitialBuild();
let res = '1080';
let upscale = false;

// ===== 2. ЭЛЕМЕНТЫ =====
const stepsEl = document.getElementById('steps');
const gamesEl = document.getElementById('games');

// ===== 3. ШАГИ С ВЫБОРОМ ДЕТАЛЕЙ =====
function renderSteps() {
  const cpu = getPart('cpu', selected.cpu);

  stepsEl.innerHTML = CATEGORIES.map((cat, i) => {
    const current = getPart(cat.key, selected[cat.key]);

    const options = PARTS[cat.key].map(part => {
      const isSelected = part.id === selected[cat.key];
      // Материнская плата под другой сокет — недоступна
      const isDisabled = cat.key === 'mb' && part.socket !== cpu.socket;
      const classes = ['option', isSelected && 'is-selected', isDisabled && 'is-disabled'].filter(Boolean).join(' ');

      return `
        <button class="${classes}" data-cat="${cat.key}" data-id="${part.id}" ${isDisabled ? 'disabled' : ''}>
          ${part.img ? `<div class="option__img"><img src="${img(part.img, 500)}" alt="" loading="lazy" onerror="this.remove()"></div>` : ''}
          <span class="option__name">${part.name}</span>
          <span class="option__spec">${isDisabled ? 'Не подходит к процессору' : part.spec}</span>
          ${part.hot ? `<span class="option__badge">${part.hot}</span>` : ''}
          <span class="option__price">${formatPrice(part.price)}</span>
        </button>`;
    }).join('');

    return `
      <div class="step">
        <div class="step__head">
          <span class="step__num">${String(i + 1).padStart(2, '0')}</span>
          <h3>${cat.title}</h3>
          <span class="step__chosen">${current.name}</span>
        </div>
        <div class="options">${options}</div>
      </div>`;
  }).join('');
}

// Клик по варианту (делегирование: один обработчик на все кнопки)
stepsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.option');
  if (!btn || btn.disabled) return;

  const { cat, id } = btn.dataset;   // то же самое, что cat = btn.dataset.cat; id = btn.dataset.id
  selected[cat] = id;

  // Сменили процессор на другой сокет — подбираем совместимую плату (самую дешёвую)
  if (cat === 'cpu') {
    const cpu = getPart('cpu', id);
    const mb = getPart('mb', selected.mb);
    if (mb.socket !== cpu.socket) {
      const fit = PARTS.mb.filter(m => m.socket === cpu.socket).sort((a, b) => a.price - b.price)[0];
      selected.mb = fit.id;
      showToast(`Плата заменена на ${fit.name}`);
    }
  }

  // Запоминаем прокрутку, чтобы после перерисовки страница не прыгала
  const y = window.scrollY;
  update();
  window.scrollTo(0, y);
});

// ===== 4. FPS =====
// Строки игр создаём один раз, потом только меняем числа и ширину полосок —
// так полоски плавно "переезжают" благодаря transition в CSS
gamesEl.innerHTML = GAMES.map(g => `
  <div class="game" id="game-${g.id}">
    <div class="game__row">
      <span class="game__name"><span class="game__logo">${g.short}</span>${g.name}</span>
      <span class="game__fps"><span class="game__num">0</span> <small>FPS</small></span>
    </div>
    <div class="bar"><div class="bar__fill"></div></div>
    <div class="game__hint"></div>
  </div>`).join('') +
  '<p class="game__hint" style="margin-top:14px">Оценка для высоких настроек графики. Реальный FPS зависит от сцены и драйверов.</p>';

function renderFps(build) {
  GAMES.forEach(game => {
    const { fps, limitedBy } = calcFps(build, game, res, upscale);
    const row = document.getElementById('game-' + game.id);
    const level = fpsLevel(fps);

    row.className = 'game ' + level.cls;
    row.querySelector('.game__num').textContent = fps;
    // Полоска: 240 FPS и больше = полная
    row.querySelector('.bar__fill').style.width = Math.min(fps / 240, 1) * 100 + '%';
    row.querySelector('.game__hint').textContent =
      level.label + (limitedBy === 'cpu' ? ' · упор в процессор' : '');
  });
}

document.getElementById('resTabs').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  document.querySelectorAll('#resTabs button').forEach(b => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  res = btn.dataset.res;
  renderFps(resolveBuild(selected));
  renderSummary(resolveBuild(selected));
});

document.getElementById('upscale').addEventListener('change', (e) => {
  upscale = e.target.checked;
  renderFps(resolveBuild(selected));
  renderSummary(resolveBuild(selected));
});

// ===== 5. ПРАВАЯ КОЛОНКА =====
// Фото корпуса: пока грузится или если не загрузилось — прозрачное, без "битой" иконки
const photo = document.getElementById('casePhoto');
photo.style.opacity = 0;
photo.addEventListener('load', () => (photo.style.opacity = 1));
photo.addEventListener('error', () => (photo.style.opacity = 0));

function renderSummary(build) {
  // Фото корпуса
  const src = img(build.case.img, 900);
  if (photo.getAttribute('src') !== src) { photo.style.opacity = 0; photo.src = src; }

  // Название: если состав совпал с готовой сборкой — пишем её имя
  const preset = PRESETS.find(p => CATEGORIES.every(c => p.parts[c.key] === selected[c.key]));
  document.getElementById('buildName').textContent = preset ? preset.name : 'Своя сборка';

  // Потребление
  const power = buildPower(build);
  const powerBox = document.getElementById('power');
  document.getElementById('powerText').textContent = `~${power} Вт из ${build.psu.watt} Вт`;
  document.getElementById('powerBar').style.width = Math.min(power / build.psu.watt, 1) * 100 + '%';
  powerBox.classList.toggle('is-over', build.psu.watt < recommendedPsu(build));

  // Совместимость
  const notes = checkBuild(build);
  document.getElementById('notes').innerHTML = notes
    .map(n => `<li class="note note--${n.type}">${n.text}</li>`).join('');

  // Список деталей
  document.getElementById('partsList').innerHTML = CATEGORIES.map(c =>
    `<li><span>${c.title}</span><b>${build[c.key].name}</b></li>`
  ).join('') + `<li><span>Сборка и тесты</span><b>${formatPrice(ASSEMBLY_PRICE)}</b></li>`;

  document.getElementById('total').textContent = formatPrice(buildPrice(build));

  // Нижняя плашка на телефоне
  const cp = calcFps(build, GAMES.find(g => g.id === 'cyberpunk'), res, upscale).fps;
  document.getElementById('barTotal').textContent = formatPrice(buildPrice(build));
  document.getElementById('barFps').innerHTML = `Cyberpunk 2077: <em>${cp} FPS</em>`;
}

// ===== 6. ОБНОВИТЬ ВСЁ =====
function update() {
  const build = resolveBuild(selected);
  renderSteps();
  renderFps(build);
  renderSummary(build);
  try { localStorage.setItem('rigup-build', JSON.stringify(selected)); } catch (e) {}
}

// ===== 7. КНОПКИ =====
document.getElementById('orderBtn').addEventListener('click', () => {
  const build = resolveBuild(selected);
  if (checkBuild(build).some(n => n.type === 'error')) {
    showToast('Сначала исправь ошибки совместимости');
    return;
  }
  const name = document.getElementById('buildName').textContent;
  openOrder(`${name}: ${build.cpu.name}, ${build.gpu.name} — ${formatPrice(buildPrice(build))}`);
});

// Ссылка на сборку: configurator.html?cpu=...&mb=...&gpu=...
document.getElementById('shareBtn').addEventListener('click', async () => {
  const params = new URLSearchParams(selected);
  const url = location.origin + location.pathname + '?' + params;
  history.replaceState(null, '', '?' + params);   // меняем адрес без перезагрузки
  try {
    await navigator.clipboard.writeText(url);
    showToast('Ссылка скопирована');
  } catch (e) {
    showToast('Ссылка в адресной строке, скопируй её');
  }
});

document.getElementById('resetBtn').addEventListener('click', () => {
  selected = { ...PRESETS.find(p => p.id === DEFAULT_PRESET).parts };
  history.replaceState(null, '', location.pathname);
  update();
  showToast('Сборка сброшена');
});

// ===== СТАРТ =====
update();
