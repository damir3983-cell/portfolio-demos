// =====================================================================
// catalog.js — фильтр по классу сборки и сортировка
// =====================================================================

const catalogEl = document.getElementById('catalog');
const tagTabs = document.getElementById('tagTabs');
const sortSelect = document.getElementById('sort');

// Текущее состояние фильтров
let currentTag = 'all';
let currentSort = 'price-asc';

// Для сортировки по FPS берём Cyberpunk 2077 в 1440p
const cyberpunk = GAMES.find(g => g.id === 'cyberpunk');

function renderCatalog() {
  // 1. Фильтруем
  let list = currentTag === 'all' ? [...PRESETS] : PRESETS.filter(p => p.tag === currentTag);

  // 2. Считаем для каждой сборки цену и FPS (чтобы было по чему сортировать)
  list = list.map(p => {
    const build = resolveBuild(p.parts);
    return { ...p, price: buildPrice(build), fps: calcFps(build, cyberpunk, '1440').fps };
  });

  // 3. Сортируем. sort((a, b) => a - b) — по возрастанию, b - a — по убыванию
  if (currentSort === 'price-asc') list.sort((a, b) => a.price - b.price);
  if (currentSort === 'price-desc') list.sort((a, b) => b.price - a.price);
  if (currentSort === 'fps') list.sort((a, b) => b.fps - a.fps);

  // 4. Рисуем
  catalogEl.innerHTML = list.length
    ? list.map(pcCardHTML).join('')
    : '<p class="empty">Ничего не нашлось</p>';
  observeReveal(catalogEl);
}

tagTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  tagTabs.querySelectorAll('button').forEach(b => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  currentTag = btn.dataset.tag;
  renderCatalog();
});

sortSelect.addEventListener('change', () => {
  currentSort = sortSelect.value;
  renderCatalog();
});

renderCatalog();
