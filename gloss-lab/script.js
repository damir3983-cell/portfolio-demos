// ===== 1. ДАННЫЕ: список товаров =====
// category совпадает с data-filter у кнопок фильтра в HTML
// color — градиент вместо фото, emoji — иконка товара
// oldPrice — старая цена (необязательно), stock — сколько осталось на складе
const products = [
  { id: 1, name: 'Шампунь двухфазный', desc: 'Активная пена, 1 л', price: 890, oldPrice: 1090, category: 'wash', emoji: '🧴', color: '#0e7490, #082f49', badge: 'Хит', rating: 4.9, stock: 24 },
  { id: 2, name: 'Очиститель дисков', desc: 'Растворяет тормозную пыль', price: 650, category: 'wash', emoji: '🛞', color: '#334155, #0f172a', rating: 4.7, stock: 3 },
  { id: 3, name: 'Полироль Gloss Pro', desc: 'Финишная полировка, 500 мл', price: 1490, category: 'polish', emoji: '✨', color: '#7c3aed, #2e1065', badge: 'Новинка', rating: 4.8, stock: 15 },
  { id: 4, name: 'Керамика DIY-набор', desc: 'Покрытие своими руками', price: 3990, oldPrice: 4590, category: 'polish', emoji: '🛡️', color: '#22d3ee, #1e3a8a', rating: 5.0, stock: 2 },
  { id: 5, name: 'Очиститель кожи', desc: 'Бережно, без блеска', price: 790, category: 'interior', emoji: '🪑', color: '#a16207, #3b1d06', rating: 4.6, stock: 11 },
  { id: 6, name: 'Ароматизатор «Кофе»', desc: 'Держится до 60 дней', price: 350, category: 'interior', emoji: '☕', color: '#78350f, #1c0a02', rating: 4.5, stock: 40 },
  { id: 7, name: 'Микрофибра 3 шт', desc: 'Плотность 400 г/м²', price: 590, category: 'tools', emoji: '🧽', color: '#0d9488, #042f2e', rating: 4.9, stock: 30 },
  { id: 8, name: 'Пенораспылитель', desc: 'Для ручной мойки, 2 л', price: 1290, category: 'tools', emoji: '🚿', color: '#6366f1, #1e1b4b', badge: 'Хит', rating: 4.8, stock: 5 },
];

// ===== 2. КОРЗИНА: берём из localStorage, чтобы не пропадала после перезагрузки =====
// Формат: [{ id: 1, qty: 2 }, ...]
let cart = JSON.parse(localStorage.getItem('glosslab-cart')) || [];

// ===== 3. ЭЛЕМЕНТЫ СТРАНИЦЫ =====
const productsEl = document.getElementById('products');
const filtersEl = document.getElementById('filters');
const cartEl = document.getElementById('cart');
const overlayEl = document.getElementById('overlay');
const cartItemsEl = document.getElementById('cartItems');
const cartCountEl = document.getElementById('cartCount');
const cartTotalEl = document.getElementById('cartTotal');
const modalEl = document.getElementById('modal');
const orderForm = document.getElementById('orderForm');
const orderDone = document.getElementById('orderDone');
const toastEl = document.getElementById('toast');

// Красивая цена: 1490 -> "1 490 ₽"
function formatPrice(num) {
  return num.toLocaleString('ru-RU') + ' ₽';
}

// ===== 4. ВЫВОД ТОВАРОВ =====
function renderProducts(filter = 'all') {
  // Если фильтр "all" — берём все, иначе только нужную категорию
  const list = filter === 'all' ? products : products.filter(p => p.category === filter);

  // Собираем HTML всех карточек одной строкой
  productsEl.innerHTML = list.map(p => `
    <div class="product">
      <div class="product__img" style="background: linear-gradient(135deg, ${p.color})">
        ${p.badge ? `<span class="product__badge">${p.badge}</span>` : ''}
        <span class="product__emoji">${p.emoji}</span>
      </div>
      <div class="product__body">
        <div class="product__meta">
          <span class="product__rating">★ ${p.rating.toFixed(1)}</span>
          ${p.stock <= 5
            ? `<span class="product__stock product__stock--low">Осталось ${p.stock} шт</span>`
            : `<span class="product__stock">В наличии</span>`}
        </div>
        <div class="product__name">${p.name}</div>
        <div class="product__desc">${p.desc}</div>
        <div class="product__bottom">
          <span class="product__price">
            ${formatPrice(p.price)}
            ${p.oldPrice ? `<span class="product__old">${formatPrice(p.oldPrice)}</span>` : ''}
          </span>
          <button class="product__add" data-id="${p.id}" aria-label="В корзину">+</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ===== 5. ФИЛЬТРЫ =====
filtersEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter');
  if (!btn) return;  // кликнули мимо кнопки

  // Снимаем активность со всех кнопок и ставим на нажатую
  filtersEl.querySelectorAll('.filter').forEach(b => b.classList.remove('is-active'));
  btn.classList.add('is-active');

  renderProducts(btn.dataset.filter);
});

// ===== 6. ДОБАВЛЕНИЕ В КОРЗИНУ =====
// Один обработчик на весь контейнер (делегирование), а не на каждую кнопку
productsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.product__add');
  if (!btn) return;
  addToCart(Number(btn.dataset.id));
});

function addToCart(id) {
  const item = cart.find(i => i.id === id);
  if (item) {
    item.qty++;               // уже есть — увеличиваем количество
  } else {
    cart.push({ id, qty: 1 }); // нет — добавляем
  }
  updateCart();
  showToast('Добавлено в корзину 🛒');

  // Счётчик на кнопке корзины "подпрыгивает".
  // Убрать класс → заставить браузер это заметить (offsetWidth) → вернуть класс.
  // Без этого трюка анимация сработала бы только один раз.
  cartCountEl.classList.remove('is-bump');
  void cartCountEl.offsetWidth;
  cartCountEl.classList.add('is-bump');
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id); // количество 0 — удаляем
  }
  updateCart();
}

// ===== 7. ОТРИСОВКА КОРЗИНЫ =====
function updateCart() {
  // Сохраняем в браузере
  localStorage.setItem('glosslab-cart', JSON.stringify(cart));

  // Счётчик на кнопке: сумма всех qty
  const count = cart.reduce((sum, i) => sum + i.qty, 0);
  cartCountEl.textContent = count;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p class="cart__empty">Тут пока пусто 🫙</p>';
    cartTotalEl.textContent = formatPrice(0);
    return;
  }

  let total = 0;
  cartItemsEl.innerHTML = cart.map(item => {
    const p = products.find(pr => pr.id === item.id);
    total += p.price * item.qty;
    return `
      <div class="cart-item">
        <div class="cart-item__img" style="background: linear-gradient(135deg, ${p.color})">${p.emoji}</div>
        <div class="cart-item__info">
          <div class="cart-item__name">${p.name}</div>
          <div class="cart-item__price">${formatPrice(p.price * item.qty)}</div>
        </div>
        <div class="qty">
          <button data-id="${p.id}" data-delta="-1">−</button>
          <span>${item.qty}</span>
          <button data-id="${p.id}" data-delta="1">+</button>
        </div>
      </div>
    `;
  }).join('');

  cartTotalEl.textContent = formatPrice(total);
}

// Кнопки +/− внутри корзины (тоже делегирование)
cartItemsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-delta]');
  if (!btn) return;
  changeQty(Number(btn.dataset.id), Number(btn.dataset.delta));
});

// ===== 8. ОТКРЫТЬ / ЗАКРЫТЬ КОРЗИНУ =====
function openCart() {
  cartEl.classList.add('is-open');
  overlayEl.classList.add('is-open');
}
function closeCart() {
  cartEl.classList.remove('is-open');
  overlayEl.classList.remove('is-open');
}
document.getElementById('cartOpen').addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
overlayEl.addEventListener('click', closeCart); // клик по затемнению тоже закрывает

// Esc закрывает корзину и модалку — мелочь, а удобно
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCart();
    modalEl.classList.remove('is-open');
  }
});

// ===== 9. ОФОРМЛЕНИЕ ЗАКАЗА =====
document.getElementById('checkoutBtn').addEventListener('click', () => {
  if (cart.length === 0) {
    showToast('Корзина пустая, сначала добавь товары 🙂');
    return;
  }
  closeCart();
  orderForm.style.display = 'flex';  // показываем форму
  orderDone.style.display = 'none';  // прячем "спасибо"
  modalEl.classList.add('is-open');
});

document.getElementById('modalClose').addEventListener('click', () => {
  modalEl.classList.remove('is-open');
});

orderForm.addEventListener('submit', (e) => {
  e.preventDefault(); // не перезагружать страницу

  // В реальном проекте тут отправка заявки (например, в Telegram-бота)
  const data = Object.fromEntries(new FormData(orderForm));
  console.log('Новый заказ:', data, cart);

  orderForm.style.display = 'none';
  orderDone.style.display = 'block';
  orderForm.reset();
  cart = [];          // очищаем корзину
  updateCart();
});

// ===== 10. УВЕДОМЛЕНИЕ =====
let toastTimer;
function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add('is-show');
  clearTimeout(toastTimer); // если кликнули быстро несколько раз
  toastTimer = setTimeout(() => toastEl.classList.remove('is-show'), 1800);
}

// ===== 11. ФОРМА ЗАПИСИ =====
const bookingForm = document.getElementById('bookingForm');
// Нельзя выбрать дату раньше сегодняшней: min = сегодня в формате ГГГГ-ММ-ДД
bookingForm.date.min = new Date().toISOString().split('T')[0];

bookingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(bookingForm));
  console.log('Новая запись:', data);
  showToast(`Готово, ${data.name}! Ждём вас ✨`);
  bookingForm.reset();
});

// ===== 12. СЛАЙДЕР ДО / ПОСЛЕ =====
const ba = document.getElementById('ba');
document.getElementById('baRange').addEventListener('input', (e) => {
  // Передаём значение ползунка в CSS-переменную --pos, а CSS уже двигает линию и обрезку
  ba.style.setProperty('--pos', e.target.value + '%');
});

// ===== 13. ШАПКА, ПРОГРЕСС И КНОПКА "НАВЕРХ" ПРИ ПРОКРУТКЕ =====
const header = document.getElementById('header');
const progress = document.getElementById('progress');
const toTop = document.getElementById('toTop');

window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  // Сколько всего можно прокрутить = высота страницы − высота окна
  const max = document.documentElement.scrollHeight - window.innerHeight;

  progress.style.width = (scrolled / max) * 100 + '%';
  header.classList.toggle('is-scrolled', scrolled > 20);   // toggle(класс, условие)
  toTop.classList.toggle('is-show', scrolled > 600);
});

toTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== 14. БУРГЕР-МЕНЮ =====
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');

burger.addEventListener('click', () => {
  burger.classList.toggle('is-open');
  nav.classList.toggle('is-open');
});
// Клик по пункту меню — закрываем его
nav.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    burger.classList.remove('is-open');
    nav.classList.remove('is-open');
  }
});

// ===== 15. ПОЯВЛЕНИЕ БЛОКОВ ПРИ ПРОКРУТКЕ =====
// IntersectionObserver сам сообщает, когда элемент попал на экран
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target); // показали один раз — больше не следим
    }
  });
}, { threshold: 0.15 }); // сработает, когда видно 15% элемента

document.querySelectorAll('.reveal').forEach((el, i) => {
  // Небольшая задержка для соседних карточек, чтобы они появлялись "лесенкой"
  el.style.transitionDelay = (i % 4) * 0.1 + 's';
  revealObserver.observe(el);
});

// ===== 16. ЦИФРЫ, КОТОРЫЕ "НАБЕГАЮТ" =====
function animateCount(el) {
  const target = parseFloat(el.dataset.count);      // до скольки считать
  const decimals = Number(el.dataset.decimals || 0); // знаков после запятой
  const suffix = el.dataset.suffix || '';           // что дописать в конце
  const duration = 1500;                            // мс
  const start = performance.now();

  function tick(now) {
    // progress от 0 до 1
    const p = Math.min((now - start) / duration, 1);
    // "ease-out": быстро в начале, плавно в конце
    const eased = 1 - Math.pow(1 - p, 3);
    const value = target * eased;
    el.textContent = value.toLocaleString('ru-RU', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + suffix;
    if (p < 1) requestAnimationFrame(tick); // следующий кадр
  }
  requestAnimationFrame(tick);
}
document.querySelectorAll('[data-count]').forEach(animateCount);

// ===== СТАРТ =====
renderProducts();
updateCart();
