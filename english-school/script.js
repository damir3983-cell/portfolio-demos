// =====================================================
// 1. МЕНЮ-БУРГЕР (на телефоне и планшете)
// =====================================================
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');

function toggleMenu(open) {
  nav.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
}

burger.addEventListener('click', () => toggleMenu(!nav.classList.contains('is-open')));
// после клика по пункту меню — закрываем его
nav.addEventListener('click', event => {
  if (event.target.tagName === 'A') toggleMenu(false);
});


// =====================================================
// 2. ТЕСТ УРОВНЯ
// =====================================================
// correct — номер правильного ответа (считаем с нуля)
const questions = [
  {
    text: 'Как сказать: «Меня зовут Анна»?',
    options: ['My name Anna', 'My name is Anna', 'I name is Anna'],
    correct: 1,
  },
  {
    text: 'She ___ to work every day.',
    options: ['go', 'goes', 'going'],
    correct: 1,
  },
  {
    text: 'I ___ this film yesterday.',
    options: ['have seen', 'see', 'saw'],
    correct: 2,
  },
  {
    text: 'If it rains tomorrow, we ___ at home.',
    options: ['will stay', 'would stay', 'stayed'],
    correct: 0,
  },
  {
    text: 'Что значит фраза <em>«Let me sleep on it»</em>?',
    options: ['Дай мне поспать', 'Дай мне подумать до завтра', 'Я лягу на это'],
    correct: 1,
  },
  {
    text: 'By the time we arrived, the film ___.',
    options: ['already started', 'had already started', 'has already started'],
    correct: 1,
  },
];

// уровни: сколько нужно правильных ответов, чтобы получить уровень
const levels = [
  { min: 0, code: 'A1', name: 'Начальный',      text: 'Начнём с основ: за первые 4 урока научитесь представляться, заказывать еду и спрашивать дорогу.' },
  { min: 2, code: 'A2', name: 'Базовый',        text: 'Вы знаете основы. Через 3 месяца сможете поддержать разговор на бытовые темы без подготовки.' },
  { min: 4, code: 'B1', name: 'Средний',        text: 'Хорошая база! Уберём страх говорить: через 3 месяца — свободные созвоны и переписка на работе.' },
  { min: 6, code: 'B2', name: 'Выше среднего',  text: 'Отличный уровень. Прокачаем беглость и живые фразы — или подготовим к IELTS.' },
];

let currentQuestion = 0;
let score = 0;
let selected = null; // какой вариант выбран в текущем вопросе

const quizQuestion = document.getElementById('quizQuestion');
const quizResult = document.getElementById('quizResult');
const quizText = document.getElementById('quizText');
const quizOptions = document.getElementById('quizOptions');
const quizNext = document.getElementById('quizNext');
const quizStep = document.getElementById('quizStep');
const quizBar = document.getElementById('quizBar');

function showQuestion() {
  const q = questions[currentQuestion];
  selected = null;

  quizStep.textContent = `Вопрос ${currentQuestion + 1} из ${questions.length}`;
  quizBar.style.width = `${(currentQuestion / questions.length) * 100}%`;
  quizText.innerHTML = q.text;
  quizOptions.innerHTML = q.options
    .map((option, i) => `<button class="option" data-index="${i}">${option}</button>`)
    .join('');

  // состояние: ничего не выбрано — кнопка неактивна и подсказывает, что делать
  quizNext.disabled = true;
  quizNext.textContent = 'Выберите вариант';
}

function showResult() {
  // ищем самый высокий уровень, до которого «дотянул» результат
  const level = [...levels].reverse().find(l => score >= l.min);

  quizBar.style.width = '100%';
  document.getElementById('resultLevel').textContent = level.code;
  document.getElementById('resultName').textContent = `${level.name} · ${score} из ${questions.length} верно`;
  document.getElementById('resultText').textContent = level.text;
  document.getElementById('resultCta').textContent = `Записаться в группу ${level.code}`;

  quizQuestion.hidden = true;
  quizResult.hidden = false;

  // подставляем уровень в форму записи
  fillSelect(document.getElementById('level'), level.code);
}

// выбор варианта ответа
quizOptions.addEventListener('click', event => {
  const btn = event.target.closest('.option');
  if (!btn) return;

  selected = Number(btn.dataset.index);
  quizOptions.querySelectorAll('.option').forEach(o => o.classList.toggle('is-selected', o === btn));

  quizNext.disabled = false;
  quizNext.textContent = currentQuestion === questions.length - 1 ? 'Узнать уровень' : 'Дальше';
});

// кнопка «Дальше»
quizNext.addEventListener('click', () => {
  if (selected === null) return;
  if (selected === questions[currentQuestion].correct) score++;

  currentQuestion++;
  if (currentQuestion < questions.length) showQuestion();
  else showResult();
});

// пройти заново
document.getElementById('quizRestart').addEventListener('click', () => {
  currentQuestion = 0;
  score = 0;
  quizResult.hidden = true;
  quizQuestion.hidden = false;
  showQuestion();
});


// =====================================================
// 3. ТАРИФЫ
// =====================================================
const plans = [
  {
    id: 'group',
    name: 'Группа',
    who: 'до 6 человек, ваш уровень',
    price: 690,
    features: ['2 урока в неделю по 60 минут', 'Разговорный клуб по субботам', 'Записи уроков в Telegram'],
  },
  {
    id: 'pair',
    name: 'Пара',
    who: 'с другом или коллегой',
    price: 1190,
    popular: true,
    features: ['2 урока в неделю по 60 минут', 'Программа под вашу цель', 'Разговорный клуб по субботам', 'Записи уроков в Telegram'],
  },
  {
    id: 'solo',
    name: 'Индивидуально',
    who: 'один на один с преподавателем',
    price: 1790,
    features: ['Гибкое расписание', 'Программа под вашу цель', 'Подготовка к IELTS или собеседованию', 'Чат с преподавателем 7 дней в неделю'],
  },
];

const DISCOUNT_16 = 0.1; // скидка 10% за пакет из 16 занятий
let lessons = 8;

function formatPrice(n) {
  return Math.round(n).toLocaleString('ru-RU') + ' ₽';
}

function renderPlans() {
  document.getElementById('plans').innerHTML = plans.map(plan => {
    const perLesson = lessons === 16 ? plan.price * (1 - DISCOUNT_16) : plan.price;
    const total = perLesson * lessons;
    const oldTotal = plan.price * lessons;

    return `
      <article class="plan ${plan.popular ? 'plan--popular' : ''}">
        ${plan.popular ? '<span class="plan__tag">Выбирают чаще всего</span>' : ''}
        <h3 class="plan__name">${plan.name}</h3>
        <p class="plan__who">${plan.who}</p>
        <p class="plan__price">${formatPrice(perLesson)} <small>/ урок</small></p>
        <p class="plan__total">
          ${lessons === 16 ? `<s>${formatPrice(oldTotal)}</s>` : ''}
          ${formatPrice(total)} за ${lessons} занятий
        </p>
        <ul class="plan__list">${plan.features.map(f => `<li>${f}</li>`).join('')}</ul>
        <a href="#signup" class="btn ${plan.popular ? 'btn--yellow' : 'btn--outline'}" data-plan="${plan.id}">Начать с бесплатного урока</a>
      </article>`;
  }).join('');
}

// переключатель 8 / 16 занятий
document.querySelectorAll('.switch__btn').forEach(btn => {
  btn.addEventListener('click', () => {
    lessons = Number(btn.dataset.lessons);
    document.querySelectorAll('.switch__btn').forEach(b => b.classList.toggle('is-active', b === btn));
    renderPlans();
  });
});

// клик по кнопке тарифа — подставляем формат в форму
document.getElementById('plans').addEventListener('click', event => {
  const btn = event.target.closest('[data-plan]');
  if (btn) fillSelect(document.getElementById('format'), btn.dataset.plan);
});


// =====================================================
// 4. ФОРМА ЗАПИСИ
// =====================================================
const form = document.getElementById('signupForm');
const submitBtn = document.getElementById('submitBtn');
const formError = document.getElementById('formError');
const success = document.getElementById('success');

// подставить значение в выпадающий список и подсветить его
function fillSelect(select, value) {
  select.value = value;
  select.classList.add('is-filled');
  setError(select, '');
}

// маска телефона: 89001234567 → +7 (900) 123-45-67
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

function setError(input, message) {
  const field = input.closest('.field');
  field.classList.toggle('has-error', Boolean(message));
  const errorEl = field.querySelector('.field__error');
  if (errorEl) errorEl.textContent = message;
}

function validate() {
  const checks = [
    [form.name, form.name.value.trim().length < 2 ? 'Напишите имя, чтобы администратор знал, как к вам обращаться' : ''],
    [form.phone, form.phone.value.replace(/\D/g, '').length !== 11 ? 'Введите номер полностью: +7 и 10 цифр' : ''],
    [form.format, !form.format.value ? 'Выберите формат — его можно поменять позже' : ''],
  ];

  let firstInvalid = null;
  checks.forEach(([input, message]) => {
    setError(input, message);
    if (message && !firstInvalid) firstInvalid = input;
  });
  if (firstInvalid) firstInvalid.focus();
  return !firstInvalid;
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle('is-loading', isLoading);
  submitBtn.textContent = isLoading ? 'Отправляем заявку…' : 'Записаться на бесплатный урок';
}

function sendForm() {
  // ДЕМО: имитация отправки.
  // В рабочем проекте здесь будет fetch('send.php', { method: 'POST', body: new FormData(form) })
  return new Promise((resolve, reject) => {
    setTimeout(() => (navigator.onLine ? resolve() : reject(new Error('offline'))), 1200);
  });
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  formError.hidden = true;
  if (!validate()) return;

  setLoading(true);
  try {
    await sendForm();
    // состояние: успех
    const name = form.name.value.trim();
    document.getElementById('successText').textContent =
      `${name}, администратор перезвонит вам в течение 15 минут и подберёт время пробного урока.`;
    form.hidden = true;
    success.hidden = false;
  } catch {
    // состояние: ошибка
    formError.textContent = 'Не удалось отправить заявку. Проверьте интернет и нажмите кнопку ещё раз — данные сохранены.';
    formError.hidden = false;
  } finally {
    setLoading(false);
  }
});

// отправить ещё одну заявку
document.getElementById('successReset').addEventListener('click', () => {
  form.reset();
  form.querySelectorAll('.is-filled').forEach(s => s.classList.remove('is-filled'));
  success.hidden = true;
  form.hidden = false;
});

form.phone.addEventListener('input', () => {
  form.phone.value = formatPhone(form.phone.value);
});
// убираем ошибку, как только человек начал исправлять поле
form.querySelectorAll('input, select').forEach(input => {
  input.addEventListener('input', () => setError(input, ''));
});


// =====================================================
// ЗАПУСК
// =====================================================
showQuestion();
renderPlans();
