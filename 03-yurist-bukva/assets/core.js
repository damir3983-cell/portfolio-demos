/* Общий движок демо-сайтов: меню, скролл-анимации, формы с состояниями */
window.plural=function(n,a,b,c){n=Math.abs(n)%100;const m=n%10;if(n>10&&n<20)return c;if(m>1&&m<5)return b;if(m===1)return a;return c;};
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  /* ---------- Шапка и мобильное меню ---------- */
  const header = document.querySelector('.site-header');
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.site-nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
      document.body.classList.toggle('menu-open', !open);
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      burger.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      document.body.classList.remove('menu-open');
    }));
  }

  /* ---------- Скролл-анимации ----------
     [data-zoom="0.3"]   — элемент увеличивается (или уменьшается при отрицательном) по мере прокрутки героя
     [data-speed="0.2"]  — параллакс: сдвиг по Y
     [data-scrub]        — получает CSS-переменную --p от 0 до 1, пока секция проходит экран
  */
  const zooms = [...document.querySelectorAll('[data-zoom]')];
  const speeds = [...document.querySelectorAll('[data-speed]')];
  const scrubs = [...document.querySelectorAll('[data-scrub]')];
  const counters = [...document.querySelectorAll('[data-count]')];

  function progressOf(el, mode) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    if (mode === 'pin') { // для высоких «закреплённых» секций
      const total = r.height - vh;
      return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    }
    return Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
  }

  let ticking = false;
  function update() {
    ticking = false;
    const y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 24);
    if (reduce) return;
    zooms.forEach(el => {
      const host = el.closest('[data-zoom-host]') || el.parentElement;
      const r = host.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
      const k = parseFloat(el.dataset.zoom) || 0.25;
      const base = k < 0 ? 1 - k : 1;
      el.style.transform = `scale(${(base + k * p).toFixed(4)})`;
    });
    speeds.forEach(el => {
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height / 2 - window.innerHeight / 2;
      el.style.transform = `translate3d(0, ${(-mid * parseFloat(el.dataset.speed)).toFixed(1)}px, 0)`;
    });
    scrubs.forEach(el => el.style.setProperty('--p', progressOf(el, el.dataset.scrub).toFixed(4)));
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
  if (reduce) scrubs.forEach(el => el.style.setProperty('--p', 1));

  /* ---------- Счётчики ---------- */
  if ('IntersectionObserver' in window && counters.length) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const el = e.target, end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
      if (reduce) { el.textContent = end.toLocaleString('ru-RU', { minimumFractionDigits: dec }); return; }
      const t0 = performance.now(), dur = 1200;
      (function step(t) {
        const k = Math.min(1, (t - t0) / dur), v = end * (1 - Math.pow(1 - k, 3));
        el.textContent = v.toLocaleString('ru-RU', { minimumFractionDigits: dec, maximumFractionDigits: dec });
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    }), { threshold: 0.6 });
    counters.forEach(c => io.observe(c));
  }

  /* ---------- Телефонная маска ---------- */
  document.querySelectorAll('input[type="tel"]').forEach(inp => {
    inp.addEventListener('input', () => {
      let d = inp.value.replace(/\D/g, '');
      if (d.startsWith('8')) d = '7' + d.slice(1);
      if (!d.startsWith('7')) d = '7' + d;
      d = d.slice(0, 11);
      const p = ['+7'];
      if (d.length > 1) p.push(' (' + d.slice(1, 4));
      if (d.length >= 4) p.push(') ' + d.slice(4, 7));
      if (d.length >= 7) p.push('-' + d.slice(7, 9));
      if (d.length >= 9) p.push('-' + d.slice(9, 11));
      inp.value = p.join('');
    });
  });

  /* ---------- Формы: ввод → проверка → отправка → успех / ошибка ---------- */
  document.querySelectorAll('form[data-form]').forEach(form => {
    const btn = form.querySelector('button[type="submit"]');
    const status = form.querySelector('.form-status');
    const label = btn ? btn.textContent : '';
    form.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      form.querySelectorAll('[required]').forEach(f => {
        const err = f.closest('.field')?.querySelector('.field-error');
        let msg = '';
        if (f.type === 'checkbox' && !f.checked) msg = 'Отметьте согласие, без него мы не сможем перезвонить';
        else if (!f.value.trim()) msg = f.dataset.empty || 'Заполните это поле';
        else if (f.type === 'tel' && f.value.replace(/\D/g, '').length < 11) msg = 'Номер короче 11 цифр — проверьте его';
        f.classList.toggle('is-invalid', !!msg);
        f.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (err) err.textContent = msg;
        if (msg && ok) { ok = false; f.focus(); }
      });
      if (!ok) return;
      btn.disabled = true; btn.classList.add('is-loading'); btn.textContent = btn.dataset.loading || 'Отправляем…';
      if (status) { status.className = 'form-status'; status.textContent = ''; }
      setTimeout(() => {
        btn.disabled = false; btn.classList.remove('is-loading'); btn.textContent = label;
        if (!navigator.onLine) {
          status.className = 'form-status is-error';
          status.textContent = form.dataset.error || 'Заявка не ушла: нет интернета. Проверьте подключение и нажмите кнопку ещё раз — введённые данные сохранились.';
          return;
        }
        form.classList.add('is-sent');
        status.className = 'form-status is-success';
        status.innerHTML = form.dataset.success || 'Заявка принята. Перезвоним в течение 15 минут в рабочее время.';
        form.querySelectorAll('input:not([type=checkbox]):not([type=radio]), textarea').forEach(i => { i.value = ''; });
      }, 1100);
    });
    form.querySelectorAll('input, textarea, select').forEach(f => f.addEventListener('input', () => {
      if (f.classList.contains('is-invalid')) {
        f.classList.remove('is-invalid'); f.setAttribute('aria-invalid', 'false');
        const err = f.closest('.field')?.querySelector('.field-error'); if (err) err.textContent = '';
      }
    }));
  });

  /* ---------- Фильтры с пустым состоянием ----------
     <div data-filter="group"> кнопки [data-value]; элементы [data-tags="a b"] внутри [data-filter-list="group"]; пустое состояние [data-filter-empty="group"] */
  document.querySelectorAll('[data-filter]').forEach(bar => {
    const g = bar.dataset.filter;
    const list = document.querySelector(`[data-filter-list="${g}"]`);
    const empty = document.querySelector(`[data-filter-empty="${g}"]`);
    if (!list) return;
    const apply = v => {
      let n = 0;
      list.querySelectorAll('[data-tags]').forEach(it => {
        const show = v === 'all' || it.dataset.tags.split(' ').includes(v);
        it.hidden = !show; if (show) n++;
      });
      if (empty) empty.hidden = n > 0;
      bar.querySelectorAll('[data-value]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.value === v)));
    };
    bar.addEventListener('click', e => { const b = e.target.closest('[data-value]'); if (b) apply(b.dataset.value); });
    document.querySelectorAll(`[data-filter-reset="${g}"]`).forEach(r => r.addEventListener('click', () => apply('all')));
  });

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
