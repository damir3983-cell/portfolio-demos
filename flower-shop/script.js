// ===== ДАННЫЕ: БУКЕТЫ =====
// photo — id фотографии на Unsplash, tint — цвет фона, пока фото грузится
// tag — плашка на карточке
const products = [
  { id: 1,  name: 'Красные розы, 15 шт',      category: 'roses',   price: 3900, desc: 'Пионовидная роза, крафт и лента',     photo: '1561729098-cbab0f7a9f7c', tint: '#f3d6d9', popular: 1, tag: 'Хит' },
  { id: 2,  name: 'Пионы Сара Бернар, 9 шт',  category: 'peonies', price: 4900, desc: 'Розовые пионы в бумаге',              photo: '1591963944277-fe153988e471', tint: '#f8dde4', popular: 2, tag: 'Сезон' },
  { id: 3,  name: 'Тюльпаны микс, 25 шт',     category: 'tulips',  price: 2900, desc: 'Белые, сиреневые и красные',          photo: '1619962992057-be492a5816f6', tint: '#ece6ee', popular: 3 },
  { id: 4,  name: 'Нежный сборный',           category: 'mixed',   price: 3400, desc: 'Розы, ромашки и зелень в фоамиране',  photo: '1523693916903-027d144a2b7d', tint: '#f6e4e6', popular: 4 },
  { id: 5,  name: 'Цветы в шляпной коробке',  category: 'box',     price: 5200, desc: 'Кустовые розы и гвоздики, 7 дней',    photo: '1660885900184-fe13ca69392c', tint: '#f3e3e1', popular: 5, tag: 'Хит' },
  { id: 6,  name: 'Белые розы, 25 шт',        category: 'roses',   price: 5900, desc: 'Белая роза 50 см',                    photo: '1570112008549-e4181988109f', tint: '#efece6', popular: 6 },
  { id: 7,  name: 'Полевой букет',            category: 'mixed',   price: 2400, desc: 'Подсолнух, ромашки, альстромерия',    photo: '1531120364508-a6b656c3e78d', tint: '#ece3d6', popular: 7 },
  { id: 8,  name: 'Розовые тюльпаны, 15 шт',  category: 'tulips',  price: 1900, desc: 'Голландские тюльпаны, лента',         photo: '1586968295564-92fd7572718b', tint: '#f6dfe3', popular: 8 },
  { id: 9,  name: 'Пионы в вазе',             category: 'box',     price: 6400, desc: '11 пионов, ваза в подарок',           photo: '1687201173056-8a7ad4afcb94', tint: '#f3e3e1', popular: 9 },
  { id: 10, name: 'Пионовидные розы, 11 шт',  category: 'roses',   price: 3200, desc: 'Пудрово-розовая роза Остина',         photo: '1582794543139-8ac9cb0f7b11', tint: '#f8dbe2', popular: 10 },
  { id: 11, name: 'Яркий сборный',            category: 'mixed',   price: 4200, desc: 'Розы, львиный зев, тюльпаны',         photo: '1533616688419-b7a585564566', tint: '#f6e2d2', popular: 11 },
  { id: 12, name: 'Коралловые пионы, 7 шт',   category: 'peonies', price: 4300, desc: 'Сорт Корал Шарм',                     photo: '1539622230226-3d4eb483b3f2', tint: '#f7e1e6', popular: 12 },
  { id: 13, name: 'Букет из сухоцветов',      category: 'dried',   price: 2200, desc: 'Стоит до года без воды',              photo: '1622658641558-235f26dd270b', tint: '#f1e2d3', popular: 13 },
  { id: 14, name: 'Персиковые розы в вазе',   category: 'box',     price: 5600, desc: 'Розы Остина и зелень, ваза в подарок', photo: '1572454591674-2739f30d8c40', tint: '#f4e4da', popular: 14 },
  { id: 15, name: 'Авторский букет XL',       category: 'mixed',   price: 7900, desc: '35+ цветов на выбор флориста',        photo: '1487530811176-3780de880c2d', tint: '#ece3e6', popular: 15 },
];

// ссылка на фото нужного размера: Unsplash сам обрежет картинку в квадрат
function photoUrl(photo, size) {
  return `https://images.unsplash.com/photo-${photo}?w=${size}&h=${size}&fit=crop&auto=format&q=75`;
}

const DELIVERY_PRICE = 390;
const FREE_DELIVERY_FROM = 5000;

// ===== СОСТОЯНИЕ =====
let cart = loadCart();        // { id: количество }
let currentFilter = 'all';
let currentSort = 'popular';

// ===== ЭЛЕМЕНТЫ =====
const productsEl = document.getElementById('products');
const catalogEmptyEl = document.getElementById('catalogEmpty');
const filtersEl = document.getElementById('filters');
const sortEl = document.getElementById('sort');

const cartEl = document.getElementById('cart');
const overlayEl = document.getElementById('overlay');
const cartCountEl = document.getElementById('cartCount');
const cartEmptyEl = document.getElementById('cartEmpty');
const cartFilledEl = document.getElementById('cartFilled');
const cartSuccessEl = document.getElementById('cartSuccess');
const cartListEl = document.getElementById('cartList');

const formEl = document.getElementById('orderForm');
const submitBtn = document.getElementById('submitBtn');
const formErrorEl = document.getElementById('formError');
const toastEl = document.getElementById('toast');

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function formatPrice(n) {
  return n.toLocaleString('ru-RU') + ' ₽';
}

function findProduct(id) {
  return products.find(p => p.id === id);
}

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem('buton-cart')) || {};
  } catch {
    return {};
  }
}

function saveCart() {
  try {
    localStorage.setItem('buton-cart', JSON.stringify(cart));
  } catch {
    // если хранилище недоступно — корзина просто не сохранится после перезагрузки
  }
}

let toastTimer;
function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2200);
}

// ===== КАТАЛОГ =====
function getVisibleProducts() {
  let list = currentFilter === 'all'
    ? [...products]
    : products.filter(p => p.category === currentFilter);

  if (currentSort === 'cheap') list.sort((a, b) => a.price - b.price);
  if (currentSort === 'expensive') list.sort((a, b) => b.price - a.price);
  if (currentSort === 'popular') list.sort((a, b) => a.popular - b.popular);
  return list;
}

function productControls(p) {
  const qty = cart[p.id] || 0;
  if (qty === 0) {
    return `<button class="btn btn--primary product__add" data-action="add" data-id="${p.id}">В корзину</button>`;
  }
  return `<div class="stepper">
      <button data-action="dec" data-id="${p.id}" aria-label="Убрать один">−</button>
      <span>${qty}</span>
      <button data-action="inc" data-id="${p.id}" aria-label="Добавить ещё">+</button>
    </div>`;
}

function renderProducts() {
  const list = getVisibleProducts();

  // состояние «пусто»
  catalogEmptyEl.hidden = list.length > 0;
  productsEl.hidden = list.length === 0;

  productsEl.innerHTML = list.map(p => `
    <article class="product">
      <div class="product__img" style="--tint: ${p.tint}">
        ${p.tag ? `<span class="product__tag">${p.tag}</span>` : ''}
        <img src="${photoUrl(p.photo, 600)}" alt="${p.name}" loading="lazy" width="600" height="600">
      </div>
      <div class="product__body">
        <h3 class="product__name">${p.name}</h3>
        <p class="product__desc">${p.desc}</p>
        <div class="product__bottom">
          <span class="product__price">${formatPrice(p.price)}</span>
          ${productControls(p)}
        </div>
      </div>
    </article>
  `).join('');
}

// ===== КОРЗИНА: ДЕЙСТВИЯ =====
function changeQty(id, delta) {
  const qty = (cart[id] || 0) + delta;
  if (qty <= 0) delete cart[id];
  else cart[id] = qty;

  saveCart();
  renderProducts();
  renderCart();

  if (delta > 0) {
    cartCountEl.classList.remove('bump');
    void cartCountEl.offsetWidth; // перезапуск анимации
    cartCountEl.classList.add('bump');
  }
}

function getTotals() {
  let items = 0;
  let count = 0;
  for (const id in cart) {
    items += findProduct(Number(id)).price * cart[id];
    count += cart[id];
  }
  const delivery = items >= FREE_DELIVERY_FROM || items === 0 ? 0 : DELIVERY_PRICE;
  return { items, delivery, total: items + delivery, count };
}

function renderCart() {
  const { items, delivery, total, count } = getTotals();
  cartCountEl.textContent = count;

  // если заказ только что оформлен — показываем экран успеха
  if (!cartSuccessEl.hidden) return;

  const isEmpty = count === 0;
  cartEmptyEl.hidden = !isEmpty;
  cartFilledEl.hidden = isEmpty;
  if (isEmpty) return;

  cartListEl.innerHTML = Object.keys(cart).map(id => {
    const p = findProduct(Number(id));
    return `
      <li class="cart-item">
        <div class="cart-item__img" style="--tint: ${p.tint}">
          <img src="${photoUrl(p.photo, 160)}" alt="" width="64" height="64">
        </div>
        <div>
          <p class="cart-item__name">${p.name}</p>
          <p class="cart-item__price">${formatPrice(p.price * cart[id])}</p>
          <button class="cart-item__remove" data-action="remove" data-id="${p.id}">Удалить</button>
        </div>
        <div class="stepper">
          <button data-action="dec" data-id="${p.id}" aria-label="Убрать один">−</button>
          <span>${cart[id]}</span>
          <button data-action="inc" data-id="${p.id}" aria-label="Добавить ещё">+</button>
        </div>
      </li>`;
  }).join('');

  document.getElementById('sumItems').textContent = formatPrice(items);
  document.getElementById('sumDelivery').textContent = delivery === 0 ? 'Бесплатно' : formatPrice(delivery);
  document.getElementById('sumTotal').textContent = formatPrice(total);
  document.getElementById('deliveryHint').textContent = delivery === 0
    ? 'Доставка бесплатная 🎉'
    : `Добавьте ещё на ${formatPrice(FREE_DELIVERY_FROM - items)} — доставка станет бесплатной`;

  if (!submitBtn.classList.contains('is-loading')) {
    submitBtn.textContent = `Оформить заказ на ${formatPrice(total)}`;
  }
}

// ===== КОРЗИНА: ОТКРЫТЬ / ЗАКРЫТЬ =====
function openCart() {
  cartEl.classList.add('is-open');
  cartEl.setAttribute('aria-hidden', 'false');
  overlayEl.hidden = false;
  document.body.classList.add('no-scroll');
}

function closeCart() {
  cartEl.classList.remove('is-open');
  cartEl.setAttribute('aria-hidden', 'true');
  overlayEl.hidden = true;
  document.body.classList.remove('no-scroll');

  // после успешного заказа при следующем открытии показываем обычную корзину
  if (!cartSuccessEl.hidden) {
    cartSuccessEl.hidden = true;
    renderCart();
  }
}

function goToCatalog() {
  closeCart();
  document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
}

// ===== ФОРМА: ТЕЛЕФОН =====
function formatPhone(value) {
  let digits = value.replace(/\D/g, '');
  if (digits === '') return '';
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

// ===== ФОРМА: ПРОВЕРКА =====
function setError(input, message) {
  const field = input.closest('.field');
  field.classList.toggle('has-error', Boolean(message));
  field.querySelector('.field__error').textContent = message;
}

function validateForm() {
  const name = formEl.name;
  const phone = formEl.phone;
  const address = formEl.address;
  const date = formEl.date;
  const time = formEl.time;

  const errors = [
    [name, name.value.trim().length < 2 ? 'Напишите имя, чтобы курьер знал, кого спросить' : ''],
    [phone, phone.value.replace(/\D/g, '').length !== 11 ? 'Введите номер полностью: +7 и 10 цифр' : ''],
    [address, address.value.trim().length < 5 ? 'Укажите улицу и дом' : ''],
    [date, !date.value ? 'Выберите дату доставки' : date.value < date.min ? 'Дата не может быть в прошлом' : ''],
    [time, !time.value ? 'Выберите удобное время' : ''],
  ];

  let firstInvalid = null;
  errors.forEach(([input, message]) => {
    setError(input, message);
    if (message && !firstInvalid) firstInvalid = input;
  });

  if (firstInvalid) firstInvalid.focus();
  return !firstInvalid;
}

// ===== ФОРМА: ОТПРАВКА =====
function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle('is-loading', isLoading);
  if (isLoading) submitBtn.textContent = 'Отправляем заказ…';
  else renderCart(); // вернёт текст «Оформить заказ на …»
}

function sendOrder() {
  // ДЕМО: здесь имитация отправки.
  // В рабочем проекте тут будет fetch('send.php', { method: 'POST', body: new FormData(formEl) })
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (navigator.onLine) resolve();
      else reject(new Error('offline'));
    }, 1200);
  });
}

async function handleSubmit(event) {
  event.preventDefault();
  formErrorEl.hidden = true;

  if (!validateForm()) return;

  setLoading(true);
  try {
    await sendOrder();

    // состояние: успех
    const orderNumber = Math.floor(1000 + Math.random() * 9000);
    document.getElementById('successTitle').textContent = `Заказ №${orderNumber} принят`;
    cart = {};
    saveCart();
    formEl.reset();
    cartFilledEl.hidden = true;
    cartSuccessEl.hidden = false;
    renderProducts();
  } catch {
    // состояние: ошибка
    formErrorEl.textContent = 'Не удалось отправить заказ. Проверьте интернет и нажмите кнопку ещё раз — корзина сохранена.';
    formErrorEl.hidden = false;
  } finally {
    setLoading(false);
    cartCountEl.textContent = getTotals().count;
  }
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
// клики по кнопкам «В корзину», «+», «−», «Удалить» — одним обработчиком на весь документ
document.addEventListener('click', event => {
  const btn = event.target.closest('[data-action]');
  if (!btn) return;

  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;

  if (action === 'add') {
    changeQty(id, 1);
    showToast(`«${findProduct(id).name}» в корзине`);
  }
  if (action === 'inc') changeQty(id, 1);
  if (action === 'dec') changeQty(id, -1);
  if (action === 'remove') changeQty(id, -cart[id]);
});

// фильтры
filtersEl.addEventListener('click', event => {
  const btn = event.target.closest('[data-filter]');
  if (!btn) return;
  currentFilter = btn.dataset.filter;
  filtersEl.querySelectorAll('.filter').forEach(f => f.classList.toggle('is-active', f === btn));
  renderProducts();
});

// кнопка «Показать все букеты» в пустом состоянии
document.querySelector('[data-filter-reset]').addEventListener('click', () => {
  filtersEl.querySelector('[data-filter="all"]').click();
});

// сортировка
sortEl.addEventListener('change', () => {
  currentSort = sortEl.value;
  renderProducts();
});

// корзина
document.getElementById('cartOpen').addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
overlayEl.addEventListener('click', closeCart);
document.getElementById('toCatalog').addEventListener('click', goToCatalog);
document.getElementById('successBack').addEventListener('click', goToCatalog);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && cartEl.classList.contains('is-open')) closeCart();
});

// форма
formEl.phone.addEventListener('input', () => {
  formEl.phone.value = formatPhone(formEl.phone.value);
});
formEl.querySelectorAll('input, select').forEach(input => {
  // убираем ошибку, как только человек начал исправлять поле
  input.addEventListener('input', () => setError(input, ''));
});
formEl.addEventListener('submit', handleSubmit);

// минимальная дата — сегодня
const now = new Date();
const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
formEl.date.min = today;

// если фото не загрузилось — вместо битой картинки показываем подпись
document.addEventListener('error', event => {
  if (event.target.tagName === 'IMG') event.target.parentElement.classList.add('is-broken');
}, true);

// ===== ЗАПУСК =====
renderProducts();
renderCart();
