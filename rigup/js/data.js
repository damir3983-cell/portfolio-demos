// =====================================================================
// data.js — ВСЕ ДАННЫЕ САЙТА В ОДНОМ МЕСТЕ
// Подключается на каждой странице ПЕРВЫМ, остальные скрипты берут данные отсюда.
// Цены и FPS демонстрационные — для портфолио.
// =====================================================================

// Фото с Unsplash (бесплатная лицензия, можно в коммерции).
// img() собирает ссылку нужной ширины: img('photo-...', 800)
const img = (id, w = 900) => `https://images.unsplash.com/${id}?w=${w}&q=75&auto=format&fit=crop`;

// ===== КОМПЛЕКТУЮЩИЕ =====
// score — условная мощность (лучшая модель ≈ 100), нужна для расчёта FPS
// tdp — сколько ватт потребляет под нагрузкой, нужно для проверки блока питания
const PARTS = {
  cpu: [
    { id: 'i5-14400f', name: 'Intel Core i5-14400F', spec: '10 ядер · до 4.7 ГГц', socket: 'LGA1700', tdp: 148, score: 66, price: 12990 },
    { id: 'u5-245k', name: 'Intel Core Ultra 5 245K', spec: '14 ядер · до 5.2 ГГц', socket: 'LGA1851', tdp: 159, score: 77, price: 22990 },
    { id: 'r5-9600x', name: 'AMD Ryzen 5 9600X', spec: '6 ядер · до 5.4 ГГц', socket: 'AM5', tdp: 88, score: 78, price: 19990 },
    { id: 'r7-9700x', name: 'AMD Ryzen 7 9700X', spec: '8 ядер · до 5.5 ГГц', socket: 'AM5', tdp: 88, score: 82, price: 27990 },
    { id: 'u7-265k', name: 'Intel Core Ultra 7 265K', spec: '20 ядер · до 5.5 ГГц', socket: 'LGA1851', tdp: 250, score: 88, price: 32990 },
    { id: 'r7-9800x3d', name: 'AMD Ryzen 7 9800X3D', spec: '8 ядер · 3D V-Cache', socket: 'AM5', tdp: 120, score: 100, price: 47990, hot: 'Лучший для игр' },
    { id: 'r9-9950x3d', name: 'AMD Ryzen 9 9950X3D', spec: '16 ядер · 3D V-Cache', socket: 'AM5', tdp: 200, score: 102, price: 69990 },
  ],
  mb: [
    { id: 'b760', name: 'MSI PRO B760M-A WIFI', spec: 'LGA1700 · DDR5 · mATX', socket: 'LGA1700', price: 12990 },
    { id: 'b860', name: 'ASUS TUF GAMING B860-PLUS WIFI', spec: 'LGA1851 · DDR5 · ATX', socket: 'LGA1851', price: 17990 },
    { id: 'z890', name: 'ASUS ROG STRIX Z890-A', spec: 'LGA1851 · разгон · ATX', socket: 'LGA1851', price: 32990 },
    { id: 'b650', name: 'Gigabyte B650 AORUS ELITE AX', spec: 'AM5 · DDR5 · ATX', socket: 'AM5', price: 15990 },
    { id: 'x870e', name: 'MSI MAG X870E TOMAHAWK WIFI', spec: 'AM5 · PCIe 5.0 · ATX', socket: 'AM5', price: 34990 },
  ],
  gpu: [
    { id: 'rtx5060', name: 'GeForce RTX 5060', spec: '8 ГБ GDDR7', vram: 8, tdp: 145, score: 38, price: 32990 },
    { id: 'rx9060xt', name: 'Radeon RX 9060 XT', spec: '16 ГБ GDDR6', vram: 16, tdp: 160, score: 45, price: 39990 },
    { id: 'rtx5060ti', name: 'GeForce RTX 5060 Ti', spec: '16 ГБ GDDR7', vram: 16, tdp: 180, score: 46, price: 45990 },
    { id: 'rtx5070', name: 'GeForce RTX 5070', spec: '12 ГБ GDDR7', vram: 12, tdp: 250, score: 56, price: 59990 },
    { id: 'rx9070xt', name: 'Radeon RX 9070 XT', spec: '16 ГБ GDDR6', vram: 16, tdp: 304, score: 68, price: 71990, hot: 'Выгодно' },
    { id: 'rtx5070ti', name: 'GeForce RTX 5070 Ti', spec: '16 ГБ GDDR7', vram: 16, tdp: 300, score: 70, price: 89990 },
    { id: 'rtx5080', name: 'GeForce RTX 5080', spec: '16 ГБ GDDR7', vram: 16, tdp: 360, score: 80, price: 124990 },
    { id: 'rtx5090', name: 'GeForce RTX 5090', spec: '32 ГБ GDDR7', vram: 32, tdp: 575, score: 100, price: 279990 },
  ],
  ram: [
    { id: 'ram16', name: '16 ГБ DDR5', spec: '2×8 ГБ · 5600 МГц', size: 16, price: 6990 },
    { id: 'ram32', name: '32 ГБ DDR5', spec: '2×16 ГБ · 6000 МГц', size: 32, price: 12990, hot: 'Оптимально' },
    { id: 'ram64', name: '64 ГБ DDR5', spec: '2×32 ГБ · 6000 МГц', size: 64, price: 25990 },
  ],
  ssd: [
    { id: 'ssd1', name: 'SSD 1 ТБ NVMe', spec: 'PCIe 4.0 · 7000 МБ/с', price: 6990 },
    { id: 'ssd2', name: 'SSD 2 ТБ NVMe', spec: 'PCIe 4.0 · 7400 МБ/с', price: 12990 },
    { id: 'ssd4', name: 'SSD 4 ТБ NVMe', spec: 'PCIe 5.0 · 12000 МБ/с', price: 29990 },
  ],
  cooler: [
    // maxTdp — сколько ватт тепла охлаждение способно отвести
    { id: 'air', name: 'Башенный кулер', spec: '6 тепловых трубок', type: 'air', maxTdp: 200, price: 3990 },
    { id: 'aio240', name: 'СЖО 240 мм', spec: '2 вентилятора · ARGB', type: 'aio', maxTdp: 250, price: 8990 },
    { id: 'aio360', name: 'СЖО 360 мм', spec: '3 вентилятора · LCD-экран', type: 'aio', maxTdp: 320, price: 14990 },
  ],
  psu: [
    { id: 'psu650', name: '650 Вт 80+ Bronze', spec: 'Для начальных сборок', watt: 650, price: 6490 },
    { id: 'psu750', name: '750 Вт 80+ Gold', spec: 'Модульный', watt: 750, price: 9490 },
    { id: 'psu850', name: '850 Вт 80+ Gold', spec: 'Модульный · ATX 3.1', watt: 850, price: 11990 },
    { id: 'psu1000', name: '1000 Вт 80+ Gold', spec: 'Модульный · ATX 3.1', watt: 1000, price: 15990 },
    { id: 'psu1200', name: '1200 Вт 80+ Platinum', spec: 'Модульный · ATX 3.1', watt: 1200, price: 23990 },
  ],
  case: [
    { id: 'airflow', name: 'RigUp Airflow', spec: 'Сетчатый фронт · 4 вентилятора', img: 'photo-1591238372408-8b98667c0460', price: 6990 },
    { id: 'panorama', name: 'RigUp Panorama', spec: 'Стекло с двух сторон · ARGB', img: 'photo-1738245494097-9b1e3971c3eb', price: 11990, hot: 'Хит' },
    { id: 'compact', name: 'RigUp Compact', spec: 'Mini-ITX · дерево и металл', img: 'photo-1777138029247-9edd315f95a7', price: 13990 },
  ],
};

// Порядок шагов в конфигураторе и их подписи
const CATEGORIES = [
  { key: 'cpu', title: 'Процессор' },
  { key: 'mb', title: 'Материнская плата' },
  { key: 'gpu', title: 'Видеокарта' },
  { key: 'ram', title: 'Оперативная память' },
  { key: 'ssd', title: 'Накопитель' },
  { key: 'cooler', title: 'Охлаждение' },
  { key: 'psu', title: 'Блок питания' },
  { key: 'case', title: 'Корпус' },
];

// Стоимость сборки, тестов и кабель-менеджмента
const ASSEMBLY_PRICE = 4990;

// ===== ГОТОВЫЕ СБОРКИ (каталог) =====
const PRESETS = [
  { id: 'start', name: 'RigUp Start', tag: 'Старт', img: 'photo-1591238372338-22d30c883a86',
    desc: 'Входной билет в гейминг: киберспорт на максималках и новинки в Full HD.',
    parts: { cpu: 'i5-14400f', mb: 'b760', gpu: 'rtx5060', ram: 'ram16', ssd: 'ssd1', cooler: 'air', psu: 'psu650', case: 'airflow' } },
  { id: 'core', name: 'RigUp Core', tag: 'Старт', img: 'photo-1587202372775-e229f172b9d7',
    desc: 'Сбалансированная сборка на AMD с запасом видеопамяти.',
    parts: { cpu: 'r5-9600x', mb: 'b650', gpu: 'rx9060xt', ram: 'ram32', ssd: 'ssd1', cooler: 'air', psu: 'psu650', case: 'airflow' } },
  { id: 'arena', name: 'RigUp Arena', tag: 'Геймер', img: 'photo-1640036948080-99d48ca959b3',
    desc: 'Для тех, кто играет и стримит: 16 ГБ видеопамяти и мощный процессор.',
    parts: { cpu: 'u5-245k', mb: 'b860', gpu: 'rtx5060ti', ram: 'ram32', ssd: 'ssd2', cooler: 'aio240', psu: 'psu750', case: 'panorama' } },
  { id: 'pro', name: 'RigUp Pro', tag: 'Геймер', img: 'photo-1660855551740-4474188debdb',
    desc: 'Золотая середина для 1440p: высокие FPS во всех актуальных играх.',
    parts: { cpu: 'r7-9700x', mb: 'b650', gpu: 'rtx5070', ram: 'ram32', ssd: 'ssd2', cooler: 'aio240', psu: 'psu750', case: 'panorama' } },
  { id: 'titan', name: 'RigUp Titan', tag: 'Энтузиаст', img: 'photo-1587302912306-cf1ed9c33146',
    desc: 'Лучший игровой процессор и топовый Radeon. Максимум FPS за свои деньги.',
    parts: { cpu: 'r7-9800x3d', mb: 'b650', gpu: 'rx9070xt', ram: 'ram32', ssd: 'ssd2', cooler: 'aio240', psu: 'psu850', case: 'panorama' } },
  { id: 'apex', name: 'RigUp Apex', tag: 'Энтузиаст', img: 'photo-1719927604476-dc404b85358f',
    desc: 'RTX 5070 Ti и 9800X3D: 1440p на ультрах с трассировкой лучей.',
    parts: { cpu: 'r7-9800x3d', mb: 'x870e', gpu: 'rtx5070ti', ram: 'ram32', ssd: 'ssd2', cooler: 'aio360', psu: 'psu850', case: 'panorama' } },
  { id: 'elite', name: 'RigUp Elite', tag: 'Ультра', img: 'photo-1754821305525-8517ea0737fb',
    desc: 'Игры в 4K и работа в 3D: RTX 5080, 20 ядер и жидкостное охлаждение.',
    parts: { cpu: 'u7-265k', mb: 'z890', gpu: 'rtx5080', ram: 'ram64', ssd: 'ssd2', cooler: 'aio360', psu: 'psu1000', case: 'panorama' } },
  { id: 'monolith', name: 'RigUp Monolith', tag: 'Ультра', img: 'photo-1632749042303-7f7a18ed6ff0',
    desc: 'Без компромиссов. Самое мощное железо, которое сейчас можно купить.',
    parts: { cpu: 'r9-9950x3d', mb: 'x870e', gpu: 'rtx5090', ram: 'ram64', ssd: 'ssd4', cooler: 'aio360', psu: 'psu1200', case: 'panorama' } },
];

// ===== ИГРЫ ДЛЯ РАСЧЁТА FPS =====
// gpu — FPS в 1080p на самой мощной видеокарте (score 100)
// cpu — сколько FPS "выдаёт" самый быстрый процессор (потолок, выше не прыгнешь)
// heavy — тяжёлая ли игра (тяжёлым сильнее вредит высокое разрешение и мало видеопамяти)
const GAMES = [
  { id: 'cs2', name: 'Counter-Strike 2', short: 'CS2', gpu: 620, cpu: 520, heavy: false },
  { id: 'dota', name: 'Dota 2', short: 'D2', gpu: 520, cpu: 340, heavy: false },
  { id: 'fortnite', name: 'Fortnite', short: 'FN', gpu: 270, cpu: 250, heavy: false },
  { id: 'cyberpunk', name: 'Cyberpunk 2077', short: 'CP', gpu: 190, cpu: 210, heavy: true },
  { id: 'rdr2', name: 'Red Dead Redemption 2', short: 'RDR', gpu: 175, cpu: 190, heavy: true },
  { id: 'wukong', name: 'Black Myth: Wukong', short: 'BM', gpu: 125, cpu: 200, heavy: true },
];

// Во сколько раз падает FPS при повышении разрешения
const RES_FACTOR = {
  '1080': { light: 1, heavy: 1 },
  '1440': { light: 0.8, heavy: 0.72 },
  '2160': { light: 0.55, heavy: 0.42 },
};

// ===== ФУНКЦИИ =====

// Найти деталь по категории и id: getPart('gpu', 'rtx5070')
function getPart(category, id) {
  return PARTS[category].find(p => p.id === id);
}

// Превратить { cpu: 'id', ... } в { cpu: {объект детали}, ... }
function resolveBuild(ids) {
  const build = {};
  for (const key in ids) build[key] = getPart(key, ids[key]);
  return build;
}

// Цена сборки = все детали + работа
function buildPrice(build) {
  return Object.values(build).reduce((sum, p) => sum + p.price, 0) + ASSEMBLY_PRICE;
}

// Потребление системы: процессор + видеокарта + ~90 Вт на остальное
function buildPower(build) {
  return build.cpu.tdp + build.gpu.tdp + 90;
}

// Рекомендуемый блок питания: потребление с запасом 30%
function recommendedPsu(build) {
  return Math.ceil(buildPower(build) * 1.3 / 50) * 50; // округляем вверх до 50 Вт
}

// ГЛАВНОЕ: расчёт FPS в одной игре
// res: '1080' | '1440' | '2160', upscale: true/false (DLSS/FSR)
function calcFps(build, game, res, upscale = false) {
  const type = game.heavy ? 'heavy' : 'light';

  // 1. Сколько кадров "тянет" видеокарта
  let gpuFps = game.gpu * (build.gpu.score / 100) * RES_FACTOR[res][type];

  // Мало видеопамяти в тяжёлой игре на высоком разрешении — проседание
  if (game.heavy && build.gpu.vram <= 8 && res !== '1080') {
    gpuFps *= res === '2160' ? 0.7 : 0.85;
  }
  // DLSS/FSR: игра рендерится в меньшем разрешении и дорисовывается нейросетью
  if (upscale && game.heavy) gpuFps *= 1.55;

  // 2. Сколько кадров "тянет" процессор (16 ГБ ОЗУ в тяжёлых играх немного мешают)
  let cpuFps = game.cpu * (build.cpu.score / 100);
  if (build.ram.size < 32 && game.heavy) cpuFps *= 0.9;

  // 3. Итог — по самому слабому звену
  const fps = Math.round(Math.min(gpuFps, cpuFps));
  return { fps, limitedBy: cpuFps < gpuFps ? 'cpu' : 'gpu' };
}

// Проверка совместимости: возвращает список сообщений { type: 'ok' | 'warn' | 'error', text }
function checkBuild(build) {
  const notes = [];

  if (build.cpu.socket !== build.mb.socket) {
    notes.push({ type: 'error', text: `Сокет не совпадает: процессор ${build.cpu.socket}, плата ${build.mb.socket}` });
  }

  const needPsu = recommendedPsu(build);
  if (build.psu.watt < needPsu) {
    notes.push({ type: 'error', text: `Блока питания не хватит: нужно от ${needPsu} Вт` });
  }

  if (build.cpu.tdp > build.cooler.maxTdp) {
    notes.push({ type: 'warn', text: `Процессор горячий (${build.cpu.tdp} Вт), лучше взять охлаждение помощнее` });
  }

  // Слабый процессор с топовой видеокартой — видеокарта будет простаивать
  if (build.gpu.score - build.cpu.score > 15) {
    notes.push({ type: 'warn', text: 'Процессор будет ограничивать видеокарту в лёгких играх' });
  }

  if (build.case.id === 'compact' && build.gpu.tdp > 300) {
    notes.push({ type: 'warn', text: 'В компактном корпусе такой видеокарте будет жарко' });
  }

  if (notes.length === 0) notes.push({ type: 'ok', text: 'Всё совместимо, можно собирать' });
  return notes;
}

// Цена красиво: 129990 -> "129 990 ₽"
function formatPrice(num) {
  return num.toLocaleString('ru-RU') + ' ₽';
}

// Цвет и подпись по FPS
function fpsLevel(fps) {
  if (fps >= 144) return { cls: 'fps--max', label: 'Ультраплавно' };
  if (fps >= 90) return { cls: 'fps--high', label: 'Плавно' };
  if (fps >= 55) return { cls: 'fps--mid', label: 'Комфортно' };
  return { cls: 'fps--low', label: 'Тяжело' };
}
