/* ============================================================
   script.js: поведение сайта «Дальний берег»
   Подключается на каждой странице строкой
   <script src="script.js"></script> перед </body>.
   К этому моменту вся страница уже загружена, поэтому код
   может сразу искать на ней элементы.
   ============================================================ */


/* Если в системе включено «уменьшить движение», анимации из JS не запускаем */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* 1. ИЗБРАННОЕ: сердечки на карточках туров
   Выбранные туры запоминаются в localStorage: это маленькое
   хранилище внутри браузера, данные остаются после закрытия вкладки.
   Обращения к нему обёрнуты в try/catch: в приватном режиме
   браузер может его запретить, и сайт не должен из-за этого ломаться. */

const FAV_KEY = 'db-favorites';

function loadFavs() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveFavs(list) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(list));
  } catch (e) {
    /* не получилось сохранить: ничего страшного */
  }
}

/* Включает или выключает вид сердечка */
function setHeart(heart, on) {
  heart.classList.toggle('is-fav', on);
  heart.setAttribute('aria-pressed', String(on));
  heart.setAttribute('aria-label', on ? 'Убрать из избранного' : 'Добавить в избранное');
}

function initFavorites() {
  const favs = loadFavs();

  document.querySelectorAll('.tour').forEach(function (card) {
    const heart = card.querySelector('.heart');
    const link = card.querySelector('.tour__title a');
    if (!heart || !link) return;

    /* Идентификатор тура: адрес его страницы, например tour-sochi.html */
    const id = link.getAttribute('href');
    setHeart(heart, favs.includes(id));

    heart.addEventListener('click', function () {
      const list = loadFavs();
      const index = list.indexOf(id);
      if (index === -1) {
        list.push(id);      /* не было в избранном: добавляем */
      } else {
        list.splice(index, 1); /* было: убираем */
      }
      saveFavs(list);
      setHeart(heart, index === -1);
    });
  });
}


/* 2. ФИЛЬТРЫ НА СТРАНИЦЕ «ТУРЫ»
   У каждой карточки в HTML есть атрибут data-category,
   например data-category="beach family".
   У каждой кнопки-фильтра есть data-filter, например data-filter="beach".
   Нажали кнопку: показываем карточки, у которых это слово есть в списке.
   Ещё страница понимает адрес вида tours.html#beach (фильтр)
   и tours.html?q=сочи (поиск по тексту: его отправляет форма на главной). */

function initTourFilters() {
  const chips = document.querySelectorAll('.chip');
  const cards = document.querySelectorAll('.tours .tour');
  const result = document.getElementById('filters-result');
  if (!chips.length || !result) return; /* мы не на странице «Туры» */

  const query = (new URLSearchParams(location.search).get('q') || '').trim().toLowerCase();

  /* Какой фильтр включён: берём из адреса после #, иначе «все» */
  let current = location.hash.replace('#', '') || 'all';
  if (!document.querySelector('.chip[data-filter="' + current + '"]')) {
    current = 'all';
  }

  /* animate = true, когда фильтр нажали: карточки появляются заново */
  function apply(animate) {
    let shown = 0;

    cards.forEach(function (card) {
      const categories = (card.dataset.category || '').split(' ');
      const okCategory = current === 'all' || categories.includes(current);
      const okText = !query || card.textContent.toLowerCase().includes(query);
      const visible = okCategory && okText;

      card.hidden = !visible; /* hidden скрывает карточку (см. стиль в style.css) */
      if (visible) {
        shown++;
        if (animate && !reduceMotion) {
          card.classList.remove('is-pop');
          void card.offsetWidth; /* хитрость: заставляет браузер «забыть» старую анимацию */
          card.classList.add('is-pop');
          card.addEventListener('animationend', function () {
            card.classList.remove('is-pop');
          }, { once: true });
        }
      }
    });

    chips.forEach(function (chip) {
      chip.classList.toggle('is-active', chip.dataset.filter === current);
    });

    /* Строка под фильтрами. Текст пользователя вставляем через textContent:
       так в страницу не попадёт чужой HTML-код. */
    result.textContent = shown > 0
      ? 'Найдено туров: ' + shown
      : 'Ничего не найдено. Попробуйте другой фильтр или оставьте заявку, и мы подберём тур вручную.';

    if (query) {
      result.textContent += '. Запрос: «' + query + '» ';
      const reset = document.createElement('a');
      reset.href = 'tours.html';
      reset.textContent = 'Сбросить';
      result.appendChild(reset);
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      current = chip.dataset.filter;
      /* Обновляем адрес без перезагрузки: ссылкой можно поделиться */
      history.replaceState(null, '', '#' + current);
      apply(true);
    });
  });

  apply(false);
}


/* 3. ФОРМЫ
   Формы на сайте демонстрационные: никуда ничего не отправляют.
   Мы отменяем обычную отправку (preventDefault), показываем
   сообщение и очищаем поля. Обязательные поля (атрибут required
   в HTML) браузер проверяет сам ещё до этого момента.
   В настоящем проекте здесь был бы запрос на сервер или в Telegram. */

function showMessage(form, text) {
  let msg = form.querySelector('.form-msg');
  if (!msg) {
    msg = document.createElement('p');
    msg.className = 'form-msg';
    msg.setAttribute('role', 'status'); /* экранные читалки зачитают сообщение */
    form.appendChild(msg);
  }
  msg.textContent = text;
}

function messageFor(form) {
  if (form.classList.contains('contacts__form')) {
    const nameInput = form.querySelector('#c-name');
    const name = nameInput ? nameInput.value.trim() : '';
    return 'Спасибо' + (name ? ', ' + name : '') + '! Заявка принята, мы свяжемся с вами в рабочее время.';
  }
  if (form.classList.contains('booking')) {
    return 'Заявка на тур принята. Менеджер перезвонит и уточнит детали.';
  }
  if (form.classList.contains('subscribe__form')) {
    return 'Вы подписаны. Горящие туры будем присылать на почту.';
  }
  return 'Спасибо! Данные получены.';
}

function initForms() {
  document.querySelectorAll('form').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault(); /* не даём странице перезагрузиться */

      /* Поиск на главной: переходим на страницу «Туры» с запросом.
         Сейчас учитывается только поле «Куда»; даты и ночи для примера. */
      if (form.classList.contains('search')) {
        const where = form.querySelector('#s-where').value.trim();
        location.href = 'tours.html' + (where ? '?q=' + encodeURIComponent(where) : '');
        return;
      }

      const text = messageFor(form); /* сообщение делаем до очистки полей */
      form.reset();
      showMessage(form, text);
    });
  });
}


/* 4. ДАТЫ: нельзя выбрать вылет в прошлом */

function initDates() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = now.getFullYear() + '-' + month + '-' + day; /* формат ГГГГ-ММ-ДД */

  document.querySelectorAll('input[type="date"]').forEach(function (input) {
    input.min = today;
  });
}


/* 5. ПРОКРУТКА: полоска прогресса, тень шапки, лёгкий параллакс
   Событие scroll срабатывает очень часто, поэтому тяжёлую работу
   откладываем до следующего кадра (requestAnimationFrame)
   и не выполняем её чаще одного раза за кадр. */

function initScrollEffects() {
  const header = document.querySelector('.header');
  const heroImage = document.querySelector('.hero__image');

  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true'); /* для экранных читалок это не контент */
  document.body.appendChild(bar);

  let waiting = false;

  function update() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    /* Полоска: ширина от 0 до 1 в зависимости от прокрутки */
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';

    /* Тень у шапки, когда страницу прокрутили */
    if (header) header.classList.toggle('is-scrolled', y > 10);

    /* Параллакс: картинка на первом экране едет чуть медленнее страницы.
       Свойство translate не мешает анимациям, которые используют transform. */
    if (heroImage && !reduceMotion && y < 900) {
      heroImage.style.translate = '0 ' + (y * 0.06) + 'px';
    }

    waiting = false;
  }

  window.addEventListener('scroll', function () {
    if (!waiting) {
      waiting = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  update();
}


/* 6. ПОЯВЛЕНИЕ БЛОКОВ ПРИ ПРОКРУТКЕ
   Класс .reveal мы добавляем из JS, а не пишем в HTML: если скрипт
   не загрузится, блоки просто останутся видимыми.
   IntersectionObserver сообщает, когда элемент появился на экране. */

function initReveal() {
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  const selector = [
    '.section__head', '.section__title', '.directions .direction', '.tours .tour',
    '.why', '.reviews .review', '.process__item', '.about__text', '.about__photo',
    '.contact-card', '.contacts__form', '.detail__photo', '.block',
    '.subscribe__text', '.subscribe__form', '.footer .container > div'
  ].join(', ');

  const perParent = new Map(); /* сколько элементов у каждого родителя уже получили задержку */

  document.querySelectorAll(selector).forEach(function (el) {
    if (el.closest('.hero')) return;                 /* у первого экрана своя анимация в CSS */
    if (el.parentElement.closest('.reveal')) return; /* родитель уже анимируется: вложенный не трогаем */

    /* Каскад: соседи появляются с шагом 80 мс, но не дольше 400 мс */
    const n = perParent.get(el.parentElement) || 0;
    perParent.set(el.parentElement, n + 1);
    const delay = Math.min(n, 5) * 80;

    el.dataset.revealDelay = delay;
    el.style.transitionDelay = delay + 'ms';
    el.classList.add('reveal');
  });

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      observer.unobserve(el); /* анимируем один раз */
      el.classList.add('is-visible');

      /* Когда анимация закончилась, убираем служебные классы:
         иначе они мешали бы эффекту наведения на карточках */
      setTimeout(function () {
        el.classList.remove('reveal', 'is-visible');
        el.style.transitionDelay = '';
      }, 900 + Number(el.dataset.revealDelay));
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(function (el) {
    observer.observe(el);
  });
}


/* 7. СЧЁТЧИК: число «разгоняется» от 0 до значения из data-count */

function countUp(el) {
  const target = Number(el.dataset.count);
  const duration = 1400; /* миллисекунд */
  const start = performance.now();

  function frame(now) {
    const t = Math.min((now - start) / duration, 1);  /* прогресс от 0 до 1 */
    const eased = 1 - Math.pow(1 - t, 3);             /* замедление к концу */
    el.textContent = Math.round(target * eased).toLocaleString('ru-RU');
    if (t < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function initCounters() {
  const items = document.querySelectorAll('[data-count]');
  if (!items.length || reduceMotion || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      countUp(entry.target);
    });
  }, { threshold: 0.6 });

  items.forEach(function (el) {
    el.textContent = '0'; /* стартовое значение; без JS в HTML остаётся настоящее число */
    observer.observe(el);
  });
}


/* Запуск всего: если на странице нет нужных элементов,
   соответствующая функция просто ничего не делает */
initFavorites();
initTourFilters();
initForms();
initDates();
initScrollEffects();
initReveal();
initCounters();
