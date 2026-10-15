/* ============================================================
   script.js: поведение магазина KROY
   Подключается в конце index.html: <script src="script.js"></script>
   Разделы:
    1. Помощники            7. Колода образов
    2. Меню и подсветка     8. Подписка
    3. Фото из images/      9. Прокрутка и появление блоков
    4. Главный слайдер     10. Счётчики
    5. Карусель каталога   11. Курсор и «магнитные» кнопки
    6. Товары и корзина
   ============================================================ */

/* 1. ПОМОЩНИКИ --------------------------------------------------------- */

/* Если в системе включено «уменьшить движение», анимации из JS не запускаем */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover)').matches;

const $ = function (selector, root) { return (root || document).querySelector(selector); };
const $$ = function (selector, root) { return Array.from((root || document).querySelectorAll(selector)); };

/* 1 -> «01» */
function pad(n) { return String(n).padStart(2, '0'); }

/* 5990 -> «5 990 ₽» */
function money(n) { return Number(n).toLocaleString('ru-RU') + ' ₽'; }

/* localStorage может быть недоступен (приватное окно), поэтому всё через try/catch */
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* не страшно */ }
}
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}

/* Перезапуск CSS-анимации: убрать класс, «потрогать» элемент, вернуть класс */
function replay(el, className) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}


/* 2. МЕНЮ И ПОДСВЕТКА РАЗДЕЛА ------------------------------------------ */

function initMenu() {
  const burger = $('#burger');
  const menu = $('#menu');
  if (!burger || !menu) return;

  function setOpen(open) {
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  }

  burger.addEventListener('click', function () {
    setOpen(burger.getAttribute('aria-expanded') !== 'true');
  });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
}

/* Шторка при переходе между страницами: экран закрывается фиолетовой шторкой,
   и только потом открывается новая страница. На новой странице шторка уезжает вверх (CSS). */
function initCurtain() {
  const curtain = $('.page-curtain');
  if (!curtain) return;

  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;

    const url = new URL(a.href, location.href);
    if (url.protocol !== location.protocol) return;                          /* mailto:, tel: */
    if (url.pathname === location.pathname && url.search === location.search) return; /* якорь на этой же странице */
    if (!/\.html$|\/$/.test(url.pathname)) return;

    e.preventDefault();
    curtain.classList.add('is-on');
    setTimeout(function () { location.href = a.href; }, reduceMotion ? 0 : 480);
  });

  /* Если вернулись кнопкой «Назад», браузер мог показать страницу из кэша вместе со шторкой */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) curtain.classList.remove('is-on');
  });
}


/* 3. ФОТО ИЗ ПАПКИ images/ ----------------------------------------------
   У элементов с data-photo="images/…" мы пробуем загрузить файл.
   Получилось: ставим его фоном и прячем рисованный силуэт.
   Файла нет: ничего не происходит, остаётся рисунок. */

function initPhotos(root) {
  $$('[data-photo]', root).forEach(function (el) {
    const src = el.dataset.photo;
    const probe = new Image();
    probe.onload = function () {
      el.style.setProperty('--photo', 'url("' + src + '")');
      el.classList.add('has-photo');
    };
    probe.src = src;
  });
}


/* 4. ГЛАВНЫЙ СЛАЙДЕР ----------------------------------------------------
   Слайды лежат друг на друге. Новый раскрывается кругом (CSS),
   а мы только переставляем классы is-active и is-leaving.
   Автопрокруткой управляет полоска внизу: когда её CSS-анимация
   закончилась, переходим к следующему слайду. */

function initHero() {
  const stage = $('#hero');
  if (!stage) return;

  const slides = $$('.slide', stage);
  const dotsBox = $('#hero-dots');
  const count = $('#hero-count');
  const bar = $('#hero-bar');
  let current = 0;

  /* Точки создаём здесь, чтобы их число всегда равнялось числу слайдов */
  const dots = slides.map(function (slide, i) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', 'Слайд ' + (i + 1));
    dot.addEventListener('click', function () { show(i); });
    dotsBox.appendChild(dot);
    return dot;
  });

  function paint() {
    count.textContent = pad(current + 1) + ' / ' + pad(slides.length);
    dots.forEach(function (dot, i) {
      dot.classList.toggle('is-active', i === current);
      dot.setAttribute('aria-selected', String(i === current));
    });
  }

  function restartBar() {
    bar.classList.remove('run');
    if (reduceMotion) return; /* без движения автопрокрутки нет */
    void bar.offsetWidth;
    bar.classList.add('run');
  }

  function show(index) {
    index = (index + slides.length) % slides.length;
    if (index === current) return;

    const old = slides[current];
    old.classList.remove('is-active');
    old.classList.add('is-leaving');
    setTimeout(function () { old.classList.remove('is-leaving'); }, 1100);

    slides[index].classList.remove('is-leaving');
    slides[index].classList.add('is-active');
    current = index;
    paint();
    restartBar();
  }

  $('#hero-prev').addEventListener('click', function () { show(current - 1); });
  $('#hero-next').addEventListener('click', function () { show(current + 1); });
  bar.addEventListener('animationend', function () { show(current + 1); });

  /* Свайп пальцем на телефоне */
  let startX = null;
  stage.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* Стрелки на клавиатуре, пока фокус внутри слайдера */
  stage.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') show(current + 1);
    if (e.key === 'ArrowLeft') show(current - 1);
  });

  /* Лёгкий сдвиг картинок за мышкой */
  if (canHover && !reduceMotion) {
    stage.addEventListener('pointermove', function (e) {
      const r = stage.getBoundingClientRect();
      stage.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      stage.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
  }

  paint();
  restartBar();
}


/* 5. КАРУСЕЛЬ КАТАЛОГА --------------------------------------------------
   Это обычная горизонтальная прокрутка с «примагничиванием» (CSS scroll-snap).
   Мы добавляем: стрелки, счётчик «01 из 06», полоску прогресса,
   перетаскивание мышью и наклон карточек за курсором. */

function initCarousel() {
  const track = $('#track');
  if (!track) return;

  const cards = $$('.product', track);
  const prev = $('#track-prev');
  const next = $('#track-next');
  const countEl = $('#track-count');
  const line = $('#track-line');

  /* На сколько пикселей сдвинуть ленту, чтобы показать следующую карточку */
  function step() {
    return cards.length > 1
      ? cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left
      : track.clientWidth;
  }

  /* Положение карточки внутри прокручиваемой ленты, с учётом левого отступа */
  function targetLeft(card) {
    const pad = parseFloat(getComputedStyle(track).paddingLeft);
    return card.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft - pad;
  }

  function update() {
    const max = track.scrollWidth - track.clientWidth;
    const atEnd = track.scrollLeft >= max - 2;
    const index = atEnd ? cards.length - 1 : Math.min(cards.length - 1, Math.round(track.scrollLeft / step()));

    countEl.textContent = pad(index + 1) + ' из ' + pad(cards.length);
    line.style.transform = 'scaleX(' + ((track.scrollLeft + track.clientWidth) / track.scrollWidth).toFixed(3) + ')';
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = atEnd;
  }

  function go(direction) {
    track.scrollBy({ left: direction * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  prev.addEventListener('click', function () { go(-1); });
  next.addEventListener('click', function () { go(1); });
  track.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
  window.addEventListener('resize', update);
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });

  /* Перетаскивание мышью (на телефоне лента и так листается пальцем) */
  let drag = null;
  track.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    if (e.target.closest('button, a')) return;
    drag = { x: e.clientX, left: track.scrollLeft, moved: false };
  });
  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 5) {
      drag.moved = true;
      track.classList.add('is-dragging');
    }
    if (drag.moved) track.scrollLeft = drag.left - dx;
  });
  window.addEventListener('pointerup', function () {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    if (!moved) return;
    track.classList.remove('is-dragging');
    /* Докручиваем до ближайшей карточки */
    let best = cards[0];
    cards.forEach(function (c) {
      if (Math.abs(targetLeft(c) - track.scrollLeft) < Math.abs(targetLeft(best) - track.scrollLeft)) best = c;
    });
    track.scrollTo({ left: targetLeft(best), behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  cards.forEach(bindTilt);

  update();
}

/* Наклон карточки за курсором (работает и в карусели, и в каталоге) */
function bindTilt(card) {
  if (!canHover || reduceMotion) return;
  card.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
    card.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg');
  });
  card.addEventListener('pointerleave', function () {
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  });
}


/* 6. ТОВАРЫ И КОРЗИНА ---------------------------------------------------- */

const cart = { items: load('kroy-cart', []) };
let lastAddedKey = null;

/* Избранное одно на все страницы и запоминается в браузере */
const favorites = new Set(load('kroy-fav', []));

function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
  save('kroy-fav', Array.from(favorites));
}

function initProducts() {
  $$('.product').forEach(bindProduct);
}

/* Оживляет одну карточку товара: цвета, избранное, кнопка «В корзину».
   Вызывается и для карточек из HTML, и для тех, что строит JS (каталог, похожие товары). */
function bindProduct(product) {
  {
    const art = $('.product__art', product);
    const svg = $('.art', art);

    /* Выбор цвета: меняем --c (он плавно перетекает) и «переворачиваем» рисунок */
    $$('.sw', product).forEach(function (sw) {
      sw.addEventListener('click', function () {
        $$('.sw', product).forEach(function (other) {
          other.classList.toggle('is-active', other === sw);
          other.setAttribute('aria-pressed', String(other === sw));
        });
        art.style.setProperty('--c', sw.dataset.color);
        if (!reduceMotion) replay(svg, 'is-flip');
      });
    });

    /* Избранное запоминается в браузере */
    const fav = $('.fav', product);
    const id = product.dataset.id;
    function paintFav() {
      const on = favorites.has(id);
      fav.setAttribute('aria-pressed', String(on));
      fav.setAttribute('aria-label', on ? 'Убрать из избранного' : 'В избранное');
    }
    fav.addEventListener('click', function () {
      toggleFavorite(id);
      paintFav();
      if (!reduceMotion) replay(fav, 'pop');
    });
    paintFav();

    /* Добавление в корзину */
    const addBtn = $('.add', product);
    addBtn.addEventListener('click', function () {
      const active = $('.sw.is-active', product);
      addToCart({
        id: id,
        name: product.dataset.name,
        price: Number(product.dataset.price),
        glyph: $('use', svg).getAttribute('href'),
        color: active.dataset.color,
        colorName: active.getAttribute('aria-label')
      });
      flyToCart(svg);

      addBtn.textContent = 'Добавлено ✓';
      addBtn.classList.add('is-done');
      setTimeout(function () {
        addBtn.textContent = 'В корзину';
        addBtn.classList.remove('is-done');
      }, 1500);
    });
  }
}

/* Одна и та же вещь в разных цветах или размерах лежит в корзине отдельными строками */
function addToCart(item, qty) {
  qty = qty || 1;
  const key = item.id + '|' + item.color + '|' + (item.size || '');
  const found = cart.items.find(function (i) { return i.key === key; });
  if (found) found.qty += qty;
  else cart.items.push(Object.assign({ key: key, qty: qty }, item));
  lastAddedKey = key;
  renderCart();
}

/* Копия вещи «летит» с карточки к значку корзины */
function flyToCart(source) {
  const button = $('#cart-btn');
  if (reduceMotion) { replay(button, 'bump'); return; }

  const from = source.getBoundingClientRect();
  const to = button.getBoundingClientRect();
  const clone = source.cloneNode(true);
  clone.classList.add('fly');
  clone.style.setProperty('--c', getComputedStyle(source).getPropertyValue('--c'));
  clone.style.left = from.left + 'px';
  clone.style.top = from.top + 'px';
  clone.style.width = from.width + 'px';
  clone.style.height = from.height + 'px';
  document.body.appendChild(clone);

  const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
  const dy = (to.top + to.height / 2) - (from.top + from.height / 2);

  const flight = clone.animate([
    { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
    { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(.1) rotate(260deg)', opacity: .5 }
  ], { duration: 850, easing: 'cubic-bezier(.55, -0.25, .75, .35)' });

  flight.onfinish = function () {
    clone.remove();
    replay(button, 'bump');
  };
}

function renderCart() {
  const list = $('#cart-list');
  list.textContent = '';

  cart.items.forEach(function (item) {
    const li = document.createElement('li');
    li.className = 'cart-item' + (item.key === lastAddedKey ? ' is-new' : '');
    li.dataset.key = item.key;

    const thumb = document.createElement('div');
    thumb.className = 'cart-item__thumb';
    thumb.style.setProperty('--c', item.color);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', item.glyph);
    svg.appendChild(use);
    thumb.appendChild(svg);

    const info = document.createElement('div');
    const name = document.createElement('b');
    name.textContent = item.name;
    const color = document.createElement('small');
    color.textContent = 'Цвет: ' + item.colorName.toLowerCase() + (item.size ? ', размер ' + item.size : '');
    const qty = document.createElement('div');
    qty.className = 'qty';
    qty.innerHTML = '<button type="button" data-act="minus" aria-label="Меньше">−</button><span></span><button type="button" data-act="plus" aria-label="Больше">+</button>';
    $('span', qty).textContent = item.qty;
    info.append(name, color, qty);

    const side = document.createElement('div');
    side.className = 'cart-item__side';
    const sum = document.createElement('b');
    sum.textContent = money(item.price * item.qty);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'cart-item__remove';
    remove.dataset.act = 'remove';
    remove.textContent = 'Убрать';
    side.append(sum, remove);

    li.append(thumb, info, side);
    list.appendChild(li);
  });

  const totalQty = cart.items.reduce(function (s, i) { return s + i.qty; }, 0);
  const totalSum = cart.items.reduce(function (s, i) { return s + i.qty * i.price; }, 0);
  const badge = $('#cart-count');
  badge.textContent = totalQty;
  badge.classList.toggle('has-items', totalQty > 0);
  $('#cart-total').textContent = money(totalSum);
  save('kroy-cart', cart.items);
}

function initCart() {
  const drawer = $('#drawer');
  const overlay = $('#overlay');
  const msg = $('#checkout-msg');

  function open() {
    overlay.hidden = false;
    requestAnimationFrame(function () {
      overlay.classList.add('is-open');
      drawer.classList.add('is-open');
    });
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    drawer.focus();
  }

  function close() {
    if (!drawer.classList.contains('is-open')) return;
    overlay.classList.remove('is-open');
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    msg.textContent = '';
    setTimeout(function () { overlay.hidden = true; }, 380);
    $('#cart-btn').focus();
  }

  $('#cart-btn').addEventListener('click', open);
  $('#drawer-close').addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  /* Кнопки «+», «−» и «Убрать» внутри списка: один обработчик на весь список */
  $('#cart-list').addEventListener('click', function (e) {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const key = btn.closest('.cart-item').dataset.key;
    const item = cart.items.find(function (i) { return i.key === key; });
    if (!item) return;

    lastAddedKey = null;
    if (btn.dataset.act === 'plus') item.qty += 1;
    if (btn.dataset.act === 'minus') item.qty -= 1;
    if (btn.dataset.act === 'remove' || item.qty < 1) {
      cart.items = cart.items.filter(function (i) { return i.key !== key; });
    }
    renderCart();
  });

  $('#checkout').addEventListener('click', function () {
    if (!cart.items.length) {
      msg.textContent = 'Корзина пуста: добавьте что-нибудь из каталога.';
      return;
    }
    cart.items = [];
    lastAddedKey = null;
    renderCart();
    msg.textContent = 'Спасибо! Сайт демонстрационный, заказ никуда не отправляется.';
  });

  renderCart();
}


/* 7. КОЛОДА ОБРАЗОВ -----------------------------------------------------
   Карточки лежат стопкой. У каждой есть позиция --p (0 сверху, 1 и 2 под ней).
   Верхняя улетает в сторону (анимация Web Animations), остальные подъезжают.
   Карточку можно утащить мышью или пальцем, нажать на неё или пользоваться стрелками. */

function initDeck() {
  const deck = $('#deck');
  if (!deck) return;

  const looks = $$('.look', deck);
  const n = looks.length;
  const countEl = $('#look-count');
  let current = 0;
  let busy = false;

  deck.tabIndex = 0;

  function layout() {
    looks.forEach(function (look, i) {
      const rel = (i - current + n) % n;
      look.style.setProperty('--p', Math.min(rel, 3));
      look.style.zIndex = 10 - rel;
      look.classList.toggle('is-front', rel === 0);
      look.classList.toggle('is-hidden', rel > 2);
      look.setAttribute('aria-hidden', String(rel !== 0));
    });
    countEl.textContent = pad(current + 1) + ' из ' + pad(n);
  }

  /* dir: 1 следующий, -1 предыдущий; side: в какую сторону улетает карточка */
  function go(dir, side) {
    if (busy) return;
    busy = true;
    const duration = reduceMotion ? 1 : 560;

    if (dir === 1) {
      const front = looks[current];
      const from = getComputedStyle(front).transform; /* где карточка сейчас (учитывает перетаскивание) */
      front.style.transform = '';
      front.classList.remove('is-dragging');
      const flight = front.animate([
        { transform: from, opacity: 1 },
        { transform: 'translate(' + (side * 130) + '%, -8%) rotate(' + (side * 20) + 'deg)', opacity: 0 }
      ], { duration: duration, easing: 'cubic-bezier(.2, .8, .2, 1)', fill: 'forwards' });

      current = (current + 1) % n;
      layout();
      front.style.zIndex = 20; /* пока летит, остаётся поверх стопки */

      flight.onfinish = function () {
        flight.cancel();
        layout();
        busy = false;
      };
    } else {
      current = (current - 1 + n) % n;
      layout();
      const incoming = looks[current];
      incoming.style.setProperty('--dir', side);
      incoming.style.zIndex = 20;
      incoming.classList.add('fly-in');
      setTimeout(function () {
        incoming.classList.remove('fly-in');
        layout();
        busy = false;
      }, reduceMotion ? 1 : 620);
    }
  }

  $('#look-next').addEventListener('click', function () { go(1, 1); });
  $('#look-prev').addEventListener('click', function () { go(-1, -1); });
  deck.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1, 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1, -1); }
  });

  /* Перетаскивание верхней карточки */
  let drag = null;
  deck.addEventListener('pointerdown', function (e) {
    const look = e.target.closest('.look');
    if (busy || !look || !look.classList.contains('is-front')) return;
    drag = { look: look, x: e.clientX, dx: 0, moved: false };
    look.setPointerCapture(e.pointerId);
  });

  deck.addEventListener('pointermove', function (e) {
    if (!drag) return;
    drag.dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(drag.dx) > 6) {
      drag.moved = true;
      drag.look.classList.add('is-dragging');
    }
    if (drag.moved) {
      drag.look.style.transform = 'translate(' + drag.dx + 'px, ' + (drag.dx * 0.06) + 'px) rotate(' + (drag.dx * 0.05) + 'deg)';
    }
  });

  function release() {
    if (!drag) return;
    const d = drag;
    drag = null;

    if (!d.moved) { go(1, 1); return; } /* просто нажали: следующий образ */

    if (Math.abs(d.dx) > 90) {
      go(1, d.dx > 0 ? 1 : -1);
    } else {
      /* Не дотянули: карточка возвращается на место */
      d.look.classList.remove('is-dragging');
      d.look.style.transform = '';
    }
  }
  deck.addEventListener('pointerup', release);
  deck.addEventListener('pointercancel', release);

  layout();
}


/* 8. ПОДПИСКА -------------------------------------------------------------
   Форма демонстрационная: ничего не отправляет, только показывает ответ. */

function initNewsletter() {
  const form = $('#news-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const mail = $('#news-mail').value.trim();
    form.reset();
    $('#news-msg').textContent = 'Готово! Промокод отправлен на ' + mail + '. Сайт демонстрационный, письмо не уйдёт.';
  });
}


/* 9. ПРОКРУТКА И ПОЯВЛЕНИЕ БЛОКОВ ---------------------------------------- */

function initScrollEffects() {
  const header = $('.site-header');

  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  let waiting = false;

  function update() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    header.classList.toggle('is-scrolled', y > 10);
    waiting = false;
  }

  window.addEventListener('scroll', function () {
    if (!waiting) { waiting = true; requestAnimationFrame(update); }
  }, { passive: true });

  update();
}

/* Класс .reveal добавляем из JS, а не пишем в HTML: если скрипт
   не загрузится, блоки останутся видимыми. */
function initReveal() {
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  const selector = '.stat, .tile, .section-head, .marquee, .carousel__foot, .looks__text, .deck, .perk, .news, .footer__grid, ' +
    '.toolbar, .dcard, .step, .table-wrap, .faq details, .citem, .cform, .shop, .map, .lookcard';
  const perParent = new Map();

  $$(selector).forEach(function (el) {
    const n = perParent.get(el.parentElement) || 0;
    perParent.set(el.parentElement, n + 1);
    const delay = Math.min(n, 5) * 90;
    el.dataset.revealDelay = delay;
    el.style.transitionDelay = delay + 'ms';
    el.classList.add('reveal');
  });

  /* Карточки товаров в ленте: появляются по очереди при загрузке страницы,
     когда лента дойдёт до экрана */
  $$('.product').forEach(function (el, i) {
    const delay = Math.min(i, 4) * 90;
    el.dataset.revealDelay = delay;
    el.style.transitionDelay = delay + 'ms';
    el.classList.add('reveal');
  });

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      observer.unobserve(el);
      el.classList.add('is-visible');
      /* Когда анимация закончилась, убираем служебные классы, чтобы они не мешали наведению */
      setTimeout(function () {
        el.classList.remove('reveal', 'is-visible');
        el.style.transitionDelay = '';
      }, 1000 + Number(el.dataset.revealDelay));
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal').forEach(function (el) { observer.observe(el); });
}


/* 10. СЧЁТЧИКИ ------------------------------------------------------------ */

function countUp(el) {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const start = performance.now();

  function frame(now) {
    const t = Math.min((now - start) / 1500, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(target * eased).toLocaleString('ru-RU') + suffix;
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function initCounters() {
  const items = $$('[data-count]');
  if (!items.length || reduceMotion || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      countUp(entry.target);
    });
  }, { threshold: 0.6 });

  items.forEach(function (el) {
    el.textContent = '0' + (el.dataset.suffix || '');
    observer.observe(el);
  });
}


/* 11. КУРСОР И «МАГНИТНЫЕ» КНОПКИ ------------------------------------------ */

function initPointerEffects() {
  if (!canHover || reduceMotion) return;

  /* Мягкое свечение, которое ездит за курсором */
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  glow.setAttribute('aria-hidden', 'true');
  document.body.appendChild(glow);

  window.addEventListener('pointermove', function (e) {
    glow.style.transform = 'translate(' + e.clientX + 'px, ' + e.clientY + 'px)';
    glow.classList.add('is-on');
  });
  document.addEventListener('pointerleave', function () { glow.classList.remove('is-on'); });

  /* Кнопки слегка тянутся к курсору */
  $$('[data-magnetic]').forEach(function (btn) {
    btn.addEventListener('pointermove', function (e) {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * 0.25;
      const dy = (e.clientY - (r.top + r.height / 2)) * 0.35;
      btn.style.translate = dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px';
    });
    btn.addEventListener('pointerleave', function () { btn.style.translate = ''; });
  });
}


/* 12. КАРТОЧКИ ИЗ ДАННЫХ (products.js) --------------------------------------
   Каталог, «Смотрите также» и страница товара строятся из массива PRODUCTS.
   Если products.js не подключён (главная страница), этот код просто не запускается. */

function discount(p) { return p.old ? Math.round((1 - p.price / p.old) * 100) : 0; }

function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

function cardHTML(p) {
  const swatches = p.colors.map(function (c, i) {
    return '<button type="button" class="sw' + (i === 0 ? ' is-active' : '') + '" style="--s:' + c + '" data-color="' + c +
      '" aria-label="' + COLOR_NAMES[c] + '" aria-pressed="' + (i === 0) + '"></button>';
  }).join('');
  const chips = p.chips.map(function (c) { return '<span>' + c + '</span>'; }).join('');
  const tag = p.old ? '−' + discount(p) + '%' : p.tag;
  const price = p.old
    ? '<small><s>' + money(p.old) + '</s></small><b class="now">' + money(p.price) + '</b>'
    : '<small>Цена</small><b>' + money(p.price) + '</b>';

  return '<article class="product" data-id="' + p.id + '" data-name="' + p.name + '" data-price="' + p.price + '">' +
    '<div class="product__art" data-photo="images/' + p.id + '.jpg" style="--c:' + p.colors[0] + '">' +
      (tag ? '<span class="tag">' + tag + '</span>' : '') +
      '<button type="button" class="fav" aria-label="В избранное" aria-pressed="false"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-4.6-9.3-9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.3 6c-2.3 4.4-9.3 9-9.3 9z"/></svg></button>' +
      '<svg class="art" viewBox="0 0 200 200" aria-hidden="true"><use href="#g-' + p.glyph + '"/></svg>' +
    '</div>' +
    '<div class="product__body">' +
      '<h3><a href="product.html?id=' + p.id + '">' + p.name + '</a></h3>' +
      '<p>' + p.short + '</p>' +
      '<div class="swatches" role="group" aria-label="Цвет">' + swatches + '</div>' +
      '<div class="chips">' + chips + '</div>' +
      '<div class="product__foot"><div class="price">' + price + '</div><button type="button" class="btn btn--primary add">В корзину</button></div>' +
    '</div></article>';
}

/* Превращает строку HTML в готовую оживлённую карточку */
function makeCard(p) {
  const box = document.createElement('div');
  box.innerHTML = cardHTML(p);
  const card = box.firstElementChild;
  bindProduct(card);
  bindTilt(card);
  initPhotos(card);
  return card;
}


/* 13. КАТАЛОГ ---------------------------------------------------------------
   Фильтр по разделу, поиск по названию и сортировка. Состояние хранится в адресе
   (catalog.html?cat=tops&q=худи), поэтому ссылками на раздел можно делиться. */

function initCatalog() {
  const grid = $('#grid');
  if (!grid || typeof PRODUCTS === 'undefined') return;

  const params = new URLSearchParams(location.search);
  const state = { cat: params.get('cat') || 'all', q: (params.get('q') || '').trim(), sort: params.get('sort') || 'pop' };
  if (!CATEGORIES.some(function (c) { return c[0] === state.cat; })) state.cat = 'all';

  const filters = $('#filters');
  const search = $('#q');
  const sort = $('#sort');
  search.value = state.q;
  sort.value = state.sort;

  CATEGORIES.forEach(function (c) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter';
    btn.dataset.cat = c[0];
    btn.textContent = c[1];
    btn.addEventListener('click', function () { state.cat = c[0]; render(true); });
    filters.appendChild(btn);
  });

  function list() {
    const q = state.q.toLowerCase();
    const items = PRODUCTS.filter(function (p) {
      if (state.cat === 'sale' && !p.old) return false;
      if (state.cat !== 'all' && state.cat !== 'sale' && p.cat !== state.cat) return false;
      return !q || p.name.toLowerCase().indexOf(q) !== -1;
    });
    items.sort(function (a, b) {
      if (state.sort === 'asc') return a.price - b.price;
      if (state.sort === 'desc') return b.price - a.price;
      return b.pop - a.pop;
    });
    return items;
  }

  function render(animate) {
    const items = list();
    grid.textContent = '';
    items.forEach(function (p, i) {
      const card = makeCard(p);
      if (animate && !reduceMotion) {
        card.style.animationDelay = Math.min(i, 8) * 55 + 'ms';
        card.classList.add('is-pop');
      }
      grid.appendChild(card);
    });

    $$('.filter', filters).forEach(function (b) { b.classList.toggle('is-active', b.dataset.cat === state.cat); });
    $('#result').textContent = 'Найдено: ' + items.length + ' ' + plural(items.length, 'товар', 'товара', 'товаров');
    $('#empty').hidden = items.length > 0;

    /* Обновляем адрес, чтобы им можно было поделиться (на некоторых браузерах для file:// это запрещено, тогда пропускаем) */
    try {
      const next = new URLSearchParams();
      if (state.cat !== 'all') next.set('cat', state.cat);
      if (state.q) next.set('q', state.q);
      if (state.sort !== 'pop') next.set('sort', state.sort);
      history.replaceState(null, '', location.pathname + (next.toString() ? '?' + next : ''));
    } catch (e) { /* не страшно */ }
  }

  search.addEventListener('input', function () { state.q = search.value.trim(); render(true); });
  sort.addEventListener('change', function () { state.sort = sort.value; render(true); });
  $('#reset').addEventListener('click', function () {
    state.cat = 'all'; state.q = ''; state.sort = 'pop';
    search.value = ''; sort.value = 'pop';
    render(true);
  });

  render(false);
}


/* 14. СТРАНИЦА ТОВАРА --------------------------------------------------------
   Адрес вида product.html?id=hoodie. Слева галерея-слайдер (по одному кадру на цвет,
   плюс фото из images/, если они есть), справа выбор цвета и размера, количество, корзина. */

function initProductPage() {
  const mount = $('#pdp');
  if (!mount || typeof PRODUCTS === 'undefined') return;

  const id = new URLSearchParams(location.search).get('id');
  const p = PRODUCTS.find(function (x) { return x.id === id; });
  if (!p) {
    mount.innerHTML = '<div class="empty"><b>Такого товара нет</b><p>Возможно, ссылка устарела.</p><a class="btn btn--primary" href="catalog.html">В каталог</a></div>';
    return;
  }

  document.title = p.name + ' — KROY';
  const catName = CATEGORIES.filter(function (c) { return c[0] === p.cat; })[0][1];
  $('#crumbs').insertAdjacentHTML('beforeend',
    '<span>/</span><a href="catalog.html?cat=' + p.cat + '">' + catName + '</a><span>/</span><span aria-current="page">' + p.name + '</span>');

  const sizes = SIZES[p.cat];
  const tag = p.old ? '−' + discount(p) + '%' : p.tag;
  const arrow = function (d) { return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>'; };
  const glyph = function (c, cls) {
    return '<svg class="art' + (cls ? ' ' + cls : '') + '" viewBox="0 0 200 200" aria-hidden="true"><use href="#g-' + p.glyph + '"/></svg>';
  };

  mount.innerHTML =
    '<div class="pdp">' +
      '<div class="gallery">' +
        '<div class="gallery__stage" id="g-stage">' +
          '<div class="gallery__track" id="g-track">' +
            p.colors.map(function (c) { return '<div class="gslide" data-color="' + c + '" style="--c:' + c + '">' + glyph() + '</div>'; }).join('') +
          '</div>' +
          (tag ? '<span class="tag">' + tag + '</span>' : '') +
          '<button type="button" class="round-btn gallery__prev" id="g-prev" aria-label="Предыдущий кадр">' + arrow('M15 6l-6 6 6 6') + '</button>' +
          '<button type="button" class="round-btn gallery__next" id="g-next" aria-label="Следующий кадр">' + arrow('M9 6l6 6-6 6') + '</button>' +
          '<span class="gallery__count" id="g-count" aria-live="polite"></span>' +
        '</div>' +
        '<div class="gallery__thumbs" id="g-thumbs">' +
          p.colors.map(function (c, i) { return '<button type="button" class="gthumb" data-color="' + c + '" style="--c:' + c + '" aria-label="Кадр ' + (i + 1) + '">' + glyph() + '</button>'; }).join('') +
        '</div>' +
      '</div>' +

      '<div class="pdp__info">' +
        '<span class="eyebrow">' + catName + '</span>' +
        '<h1>' + p.name + '</h1>' +
        '<div class="rating"><span class="stars" aria-hidden="true">★★★★★</span><span>4,8 · ' + (40 + p.pop * 11) + ' ' + plural(40 + p.pop * 11, 'отзыв', 'отзыва', 'отзывов') + '</span></div>' +
        '<div class="pdp__price"><b>' + money(p.price) + '</b>' + (p.old ? '<s>' + money(p.old) + '</s><span class="off">−' + discount(p) + '%</span>' : '') + '</div>' +
        '<p class="pdp__desc">' + p.desc + '</p>' +

        '<div class="opt"><div class="opt__label"><span>Цвет: <b id="color-name"></b></span></div>' +
          '<div class="swatches" id="pdp-sw" role="group" aria-label="Цвет">' +
            p.colors.map(function (c) { return '<button type="button" class="sw" style="--s:' + c + '" data-color="' + c + '" aria-label="' + COLOR_NAMES[c] + '" aria-pressed="false"></button>'; }).join('') +
          '</div></div>' +

        '<div class="opt"><div class="opt__label"><span>Размер</span>' + (sizes.length > 1 ? '<a href="delivery.html#razmery">Таблица размеров</a>' : '') + '</div>' +
          '<div class="sizes" id="sizes" role="group" aria-label="Размер">' +
            sizes.map(function (s) { return '<button type="button" class="size" data-size="' + s + '" aria-pressed="false">' + s + '</button>'; }).join('') +
          '</div><p class="size-msg" id="size-msg" role="status"></p></div>' +

        '<div class="buy">' +
          '<div class="stepper"><button type="button" id="q-minus" aria-label="Меньше">−</button><span id="q-val" aria-live="polite">1</span><button type="button" id="q-plus" aria-label="Больше">+</button></div>' +
          '<button type="button" class="btn btn--primary" id="pdp-add">Добавить в корзину</button>' +
          '<button type="button" class="fav" id="pdp-fav" aria-label="В избранное" aria-pressed="false"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-4.6-9.3-9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.3 6c-2.3 4.4-9.3 9-9.3 9z"/></svg></button>' +
        '</div>' +

        '<div class="minis">' +
          '<div class="mini"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.5"/><circle cx="17" cy="17.5" r="1.5"/></svg>Бесплатная доставка от 5 000 ₽</div>' +
          '<div class="mini"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/></svg>Возврат 30 дней</div>' +
        '</div>' +

        '<div class="acc">' +
          '<details open><summary>Описание<span class="plus" aria-hidden="true"></span></summary><p>' + p.desc + '</p></details>' +
          '<details><summary>Состав и уход<span class="plus" aria-hidden="true"></span></summary><p>' + p.mat + '</p></details>' +
          '<details><summary>Доставка и возврат<span class="plus" aria-hidden="true"></span></summary><p>Курьером 1–3 дня, в пункт выдачи 2–4 дня. Вернуть вещь можно в течение 30 дней. <a href="delivery.html" style="text-decoration:underline">Подробные условия</a>.</p></details>' +
        '</div>' +
      '</div>' +
    '</div>';

  /* ----- Галерея ----- */
  const stage = $('#g-stage');
  const track = $('#g-track');
  const thumbs = $('#g-thumbs');
  const countEl = $('#g-count');
  let gi = 0;
  let color = p.colors[0];
  let size = sizes.length === 1 ? sizes[0] : null;
  let qty = 1;

  function slideList() { return $$('.gslide', track); }

  function gShow(i, fromColor) {
    const n = slideList().length;
    gi = (i + n) % n;
    track.style.transform = 'translateX(' + (-gi * 100) + '%)';
    slideList().forEach(function (s, k) { s.classList.toggle('is-current', k === gi); });
    $$('.gthumb', thumbs).forEach(function (t, k) { t.classList.toggle('is-active', k === gi); });
    countEl.textContent = (gi + 1) + ' / ' + n;
    const c = slideList()[gi].dataset.color;
    if (c && !fromColor) setColor(c, true);
  }

  function setColor(c, fromGallery) {
    color = c;
    $$('#pdp-sw .sw').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.color === c);
      b.setAttribute('aria-pressed', String(b.dataset.color === c));
    });
    $('#color-name').textContent = COLOR_NAMES[c];
    if (!fromGallery) {
      const k = slideList().findIndex(function (s) { return s.dataset.color === c; });
      if (k >= 0) gShow(k, true);
    }
  }

  $('#g-prev').addEventListener('click', function () { gShow(gi - 1); });
  $('#g-next').addEventListener('click', function () { gShow(gi + 1); });
  thumbs.addEventListener('click', function (e) {
    const t = e.target.closest('.gthumb');
    if (t) gShow($$('.gthumb', thumbs).indexOf(t));
  });
  $('#pdp-sw').addEventListener('click', function (e) {
    const b = e.target.closest('.sw');
    if (b) setColor(b.dataset.color);
  });
  stage.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') gShow(gi + 1);
    if (e.key === 'ArrowLeft') gShow(gi - 1);
  });

  /* Листание перетаскиванием (мышь и палец) */
  let drag = null;
  stage.addEventListener('pointerdown', function (e) {
    if (e.target.closest('button')) return;
    drag = { x: e.clientX, dx: 0, moved: false };
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', function (e) {
    if (drag) {
      drag.dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(drag.dx) > 6) { drag.moved = true; stage.classList.add('is-dragging'); }
      if (drag.moved) track.style.transform = 'translateX(calc(' + (-gi * 100) + '% + ' + drag.dx + 'px))';
    } else if (canHover && !reduceMotion && e.pointerType === 'mouse') {
      /* Точка, к которой приближается фото при наведении */
      const r = stage.getBoundingClientRect();
      stage.style.setProperty('--zx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      stage.style.setProperty('--zy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    }
  });
  function endDrag() {
    if (!drag) return;
    const d = drag;
    drag = null;
    stage.classList.remove('is-dragging');
    if (d.moved && Math.abs(d.dx) > 60) gShow(gi + (d.dx < 0 ? 1 : -1));
    else gShow(gi);
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  /* Настоящие фото: images/<id>.jpg, images/<id>-2.jpg … добавляются в галерею, если файлы есть */
  [p.id + '.jpg', p.id + '-2.jpg', p.id + '-3.jpg', p.id + '-4.jpg'].forEach(function (name) {
    const src = 'images/' + name;
    const probe = new Image();
    probe.onload = function () {
      const slide = document.createElement('div');
      slide.className = 'gslide has-photo';
      slide.style.setProperty('--photo', 'url("' + src + '")');
      track.appendChild(slide);
      const thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = 'gthumb has-photo';
      thumb.setAttribute('aria-label', 'Фото');
      thumb.style.setProperty('--photo', 'url("' + src + '")');
      thumbs.appendChild(thumb);
      gShow(gi, true);
    };
    probe.src = src;
  });

  /* ----- Размер, количество, корзина ----- */
  const sizesBox = $('#sizes');
  const sizeMsg = $('#size-msg');

  function paintSizes() {
    $$('.size', sizesBox).forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.size === size);
      b.setAttribute('aria-pressed', String(b.dataset.size === size));
    });
  }
  sizesBox.addEventListener('click', function (e) {
    const b = e.target.closest('.size');
    if (!b) return;
    size = b.dataset.size;
    sizeMsg.textContent = '';
    paintSizes();
  });

  $('#q-minus').addEventListener('click', function () { qty = Math.max(1, qty - 1); $('#q-val').textContent = qty; });
  $('#q-plus').addEventListener('click', function () { qty = Math.min(9, qty + 1); $('#q-val').textContent = qty; });

  const addBtn = $('#pdp-add');
  addBtn.addEventListener('click', function () {
    if (!size) {
      sizeMsg.textContent = 'Выберите размер';
      replay(sizesBox, 'shake');
      return;
    }
    addToCart({ id: p.id, name: p.name, price: p.price, glyph: '#g-' + p.glyph, color: color, colorName: COLOR_NAMES[color], size: size }, qty);
    flyToCart($('.gslide.is-current .art', track) || stage);
    addBtn.textContent = 'Добавлено ✓';
    addBtn.classList.add('is-done');
    setTimeout(function () { addBtn.textContent = 'Добавить в корзину'; addBtn.classList.remove('is-done'); }, 1500);
  });

  const fav = $('#pdp-fav');
  function paintFav() {
    const on = favorites.has(p.id);
    fav.setAttribute('aria-pressed', String(on));
    fav.setAttribute('aria-label', on ? 'Убрать из избранного' : 'В избранное');
  }
  fav.addEventListener('click', function () {
    toggleFavorite(p.id);
    paintFav();
    if (!reduceMotion) replay(fav, 'pop');
  });

  paintSizes();
  paintFav();
  setColor(color, true);
  gShow(0, true);

  /* ----- Смотрите также ----- */
  const related = $('#related');
  if (related) {
    const others = PRODUCTS.filter(function (x) { return x.id !== p.id; });
    others.sort(function (a, b) { return (b.cat === p.cat) - (a.cat === p.cat) || b.pop - a.pop; });
    others.slice(0, 4).forEach(function (x) { related.appendChild(makeCard(x)); });
    $('#related-box').hidden = false;
  }
}


/* 15. ОБРАЗЫ (страница) ------------------------------------------------------
   Каждый образ собран из товаров каталога. Кнопка добавляет в корзину все вещи сразу. */

function initLooksPage() {
  const box = $('#lookgrid');
  if (!box || typeof LOOKS === 'undefined') return;

  LOOKS.forEach(function (look, n) {
    const items = look.items.map(function (it) {
      return { p: PRODUCTS.find(function (x) { return x.id === it[0]; }), color: it[1] };
    });
    const total = items.reduce(function (s, it) { return s + it.p.price; }, 0);

    const card = document.createElement('article');
    card.className = 'lookcard';
    card.style.setProperty('--g1', look.g1);
    card.style.setProperty('--g2', look.g2);
    card.innerHTML =
      '<div class="lookcard__art" data-photo="images/' + look.id + '.jpg" aria-hidden="true">' +
        items.map(function (it) {
          return '<svg class="art" viewBox="0 0 200 200" style="--c:' + it.color + '"><use href="#g-' + it.p.glyph + '"/></svg>';
        }).join('') +
      '</div>' +
      '<div class="lookcard__body">' +
        '<span>Образ ' + pad(n + 1) + '</span>' +
        '<h3>' + look.title + '</h3>' +
        '<p>' + look.mood + '</p>' +
        '<ul class="lookitems">' +
          items.map(function (it) {
            return '<li><i style="--s:' + it.color + '"></i><a href="product.html?id=' + it.p.id + '">' + it.p.name + '</a><em>' + money(it.p.price) + '</em></li>';
          }).join('') +
        '</ul>' +
        '<div class="lookcard__foot"><div class="price"><small>Весь образ</small><b>' + money(total) + '</b></div>' +
        '<button type="button" class="btn btn--primary add-look">В корзину</button></div>' +
      '</div>';

    const btn = $('.add-look', card);
    btn.addEventListener('click', function () {
      items.forEach(function (it) {
        addToCart({ id: it.p.id, name: it.p.name, price: it.p.price, glyph: '#g-' + it.p.glyph, color: it.color, colorName: COLOR_NAMES[it.color] });
      });
      flyToCart($('.art', card));
      btn.textContent = 'Добавлено ✓';
      btn.classList.add('is-done');
      setTimeout(function () { btn.textContent = 'В корзину'; btn.classList.remove('is-done'); }, 1600);
    });

    box.appendChild(card);
    initPhotos(card);
  });
}


/* 16. КОНТАКТЫ ----------------------------------------------------------------
   Форма демонстрационная: ничего не отправляет. Список магазинов переключает точки на карте. */

function initContacts() {
  const form = $('#contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const fields = [$('#c-name'), $('#c-mail'), $('#c-text')];
      let bad = false;
      fields.forEach(function (f) {
        const empty = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value.trim()));
        f.classList.toggle('is-bad', empty);
        if (empty) bad = true;
      });
      const msg = $('#c-msg');
      if (bad) { msg.textContent = 'Заполните имя, почту и сообщение.'; return; }
      msg.textContent = 'Спасибо, ' + $('#c-name').value.trim() + '! Сообщение принято. Сайт демонстрационный, письмо никуда не уйдёт.';
      form.reset();
    });
  }

  const shops = $$('.shop');
  shops.forEach(function (shop) {
    shop.addEventListener('click', function () {
      shops.forEach(function (s) { s.classList.toggle('is-active', s === shop); });
      $$('.pin').forEach(function (pin) { pin.classList.toggle('is-active', pin.dataset.pin === shop.dataset.pin); });
    });
  });
}


/* Запуск всего. Каждая функция сама проверяет, есть ли нужные ей блоки на странице,
   поэтому один и тот же script.js подходит для всех страниц сайта. */
initMenu();
initCurtain();
initPhotos();
initHero();
initCarousel();
initProducts();
initCart();
initDeck();
initNewsletter();
initCatalog();
initProductPage();
initLooksPage();
initContacts();
initScrollEffects();
initReveal();
initCounters();
initPointerEffects();
