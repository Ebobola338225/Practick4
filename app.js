// =====================================================================
// Практична робота №4: DOM, події та BOM.
// Скрипт підключено в <head> з атрибутом defer: браузер завантажує його
// паралельно з розбором HTML, а виконує після побудови всього DOM-дерева,
// тому всі querySelector нижче гарантовано знаходять свої елементи.
// =====================================================================

// ---------- Допоміжне: безпечна робота з localStorage (об'єкт window) ----------
const storage = {
  get(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* приватний режим */ }
  },
};

const root = document.querySelector('html');
const page = document.querySelector('.page');

// =====================================================================
// 1. ПЛЕЄР: семплер з 8 фрагментів по 10 секунд + гарячі клавіші
// =====================================================================
const SEGMENT = 10;
const audio = document.querySelector('[data-part="audio"]');
const nowTitle = document.querySelector('[data-part="now-title"]');
const rows = [...document.querySelectorAll('.tracks tr[data-track]')];
let currentTrack = 0;

const titleOf = (row) =>
  `${row.cells[row.cells.length - 4].textContent}. ${row.querySelector('.tracks__name').textContent}`;

function markCurrent(index) {
  currentTrack = index;
  rows.forEach((row, i) => {
    if (i === index) row.setAttribute('aria-current', 'true');
    else row.removeAttribute('aria-current');
  });
  nowTitle.textContent = titleOf(rows[index]);
}

function playTrack(index) {
  const i = (index + rows.length) % rows.length; // по колу: після 8-го йде 1-й
  audio.currentTime = i * SEGMENT;
  markCurrent(i);
  audio.play().catch(() => {});
}

rows.forEach((row, i) => {
  row.querySelector('.play').addEventListener('click', () => playTrack(i));
});

document.querySelector('[data-action="play-all"]').addEventListener('click', () => playTrack(0));

audio.addEventListener('timeupdate', () => {
  const index = Math.min(rows.length - 1, Math.floor(audio.currentTime / SEGMENT));
  if (index !== currentTrack) markCurrent(index);
});

audio.addEventListener('play', () => page.classList.add('is-playing'));
audio.addEventListener('pause', () => page.classList.remove('is-playing'));
audio.addEventListener('ended', () => page.classList.remove('is-playing'));

// Гарячі клавіші (подія keydown на всьому документі)
document.addEventListener('keydown', (event) => {
  if (modalIsOpen()) return; // поки відкрите модальне вікно, клавішами керує воно
  const tag = event.target.tagName;
  const typing = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A', 'AUDIO'].includes(tag);
  if (typing || event.ctrlKey || event.metaKey || event.altKey) return;

  if (event.code === 'Space') {
    event.preventDefault(); // інакше пробіл прокрутить сторінку
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    playTrack(currentTrack + 1);
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    playTrack(currentTrack - 1);
  }
});

// =====================================================================
// 2. ЛІЧИЛЬНИК ВПОДОБАНЬ
// =====================================================================
const BASE_LIKES = 128;
const likeBtn = document.querySelector('[data-action="like"]');
const likeCount = document.querySelector('[data-part="like-count"]');
const actionStatus = document.querySelector('[data-part="action-status"]');

function renderLike(liked) {
  likeBtn.setAttribute('aria-pressed', String(liked));
  likeCount.textContent = BASE_LIKES + (liked ? 1 : 0);
}

let liked = storage.get('polonyna:liked', false);
renderLike(liked);

likeBtn.addEventListener('click', () => {
  liked = !liked;
  renderLike(liked);
  storage.set('polonyna:liked', liked);
  actionStatus.textContent = liked ? 'Дякуємо! Ви вподобали альбом.' : 'Вподобання скасовано.';
  likeBtn.classList.remove('is-popping');
  void likeBtn.offsetWidth;           // перезапуск CSS-анімації
  likeBtn.classList.add('is-popping');
});

likeBtn.addEventListener('animationend', () => likeBtn.classList.remove('is-popping'));

// =====================================================================
// 3. ПЕРЕМИКАЧ ТЕМИ: classList.toggle + window.matchMedia + localStorage
// =====================================================================
const themeBtn = document.querySelector('[data-action="theme"]');

function applyTheme(isDark) {
  root.classList.toggle('theme-dark', isDark);
  themeBtn.setAttribute('aria-pressed', String(isDark));
  themeBtn.setAttribute('aria-label', isDark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему');
}

const savedTheme = storage.get('polonyna:theme', null);
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(savedTheme ? savedTheme === 'dark' : prefersDark);

themeBtn.addEventListener('click', () => {
  const isDark = root.classList.toggle('theme-dark');
  applyTheme(isDark);
  storage.set('polonyna:theme', isDark ? 'dark' : 'light');
});

// =====================================================================
// 4. МОДАЛЬНЕ ВІКНО «ПОДІЛИТИСЯ»: classList, keydown (Escape, Tab), location, navigator
// =====================================================================
const modal = document.querySelector('[data-part="share-modal"]');
const shareBtn = document.querySelector('[data-action="share"]');
const shareUrl = document.querySelector('[data-part="share-url"]');
const modalStatus = document.querySelector('[data-part="modal-status"]');
const nativeShareBtn = document.querySelector('[data-action="native-share"]');
let lastFocused = null;

const modalIsOpen = () => modal.classList.contains('is-open');
const focusables = () => [...modal.querySelectorAll('button, a[href], input')];

function openModal() {
  lastFocused = document.activeElement;
  const url = window.location.href;             // BOM: адреса поточної сторінки
  const text = '«Полонина» — Гірський туман';
  shareUrl.value = url;
  modal.querySelector('[data-share="telegram"]').href =
    `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  modal.querySelector('[data-share="facebook"]').href =
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  modal.querySelector('[data-share="x"]').href =
    `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  nativeShareBtn.classList.toggle('is-hidden', !navigator.share); // BOM: є системне меню?
  modalStatus.textContent = '';
  modal.classList.add('is-open');
  root.classList.add('has-modal');
  shareBtn.setAttribute('aria-expanded', 'true');
  shareUrl.focus();
  shareUrl.select();
}

function closeModal() {
  modal.classList.remove('is-open');
  root.classList.remove('has-modal');
  shareBtn.setAttribute('aria-expanded', 'false');
  if (lastFocused) lastFocused.focus();
}

shareBtn.addEventListener('click', openModal);

modal.querySelectorAll('[data-action="close-modal"]').forEach((el) => {
  el.addEventListener('click', closeModal);
});

modal.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
  } else if (event.key === 'Tab') {             // фокус не виходить за межі вікна
    const items = focusables().filter((el) => !el.classList.contains('is-hidden'));
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

document.querySelector('[data-action="copy-link"]').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value); // BOM: буфер обміну
    modalStatus.textContent = 'Посилання скопійовано в буфер обміну.';
  } catch {
    shareUrl.focus();
    shareUrl.select();
    modalStatus.textContent = 'Браузер не дав доступу до буфера. Посилання виділено: натисніть Ctrl+C.';
  }
});

nativeShareBtn.addEventListener('click', async () => {
  try {
    await navigator.share({ title: document.title, url: shareUrl.value });
    modalStatus.textContent = 'Посилання надіслано.';
  } catch {
    modalStatus.textContent = 'Надсилання скасовано.';
  }
});

// =====================================================================
// 5. ВІДГУКИ: форма з валідацією, submit + preventDefault, input, blur, mouseover/mouseout
// =====================================================================
const form = document.querySelector('[data-part="review-form"]');
const list = document.querySelector('[data-part="reviews-list"]');
const countOut = document.querySelector('[data-part="reviews-count"]');
const avgOut = document.querySelector('[data-part="reviews-avg"]');
const textCounter = document.querySelector('[data-part="text-counter"]');
const formStatus = document.querySelector('[data-part="form-status"]');
const nameInput = form.querySelector('#review-name');
const textInput = form.querySelector('#review-text');
const stars = [...form.querySelectorAll('.rating__star')];
const MAX_TEXT = Number(textInput.getAttribute('maxlength'));

// Українські форми множини: 1 відгук, 2 відгуки, 5 відгуків
function plural(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} відгук`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} відгуки`;
  return `${n} відгуків`;
}

function updateSummary() {
  const items = [...list.querySelectorAll('.review')];
  const sum = items.reduce((acc, li) => acc + Number(li.dataset.rating), 0);
  countOut.textContent = plural(items.length);
  avgOut.textContent = items.length ? (sum / items.length).toFixed(1).replace('.', ',') : '—';
}

// Створення вузла відгуку. Текст користувача вставляється лише через textContent,
// тому HTML-теги у відгуку відображаються як текст і не виконуються (захист від XSS).
function createReview({ id, name, rating, text, date }) {
  const li = document.createElement('li');
  li.className = 'review review--own';
  li.dataset.rating = rating;
  li.dataset.id = id;

  const article = document.createElement('article');
  article.className = 'review__card';

  const head = document.createElement('header');
  head.className = 'review__head';

  const h3 = document.createElement('h3');
  h3.className = 'review__name';
  h3.textContent = name;

  const starsP = document.createElement('p');
  starsP.className = 'review__stars';
  const starsLabel = document.createElement('span');
  starsLabel.className = 'visually-hidden';
  starsLabel.textContent = `Оцінка ${rating} з 5`;
  const starsIcons = document.createElement('span');
  starsIcons.setAttribute('aria-hidden', 'true');
  starsIcons.textContent = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  starsP.append(starsLabel, starsIcons);

  const textP = document.createElement('p');
  textP.className = 'review__text';
  textP.textContent = text;

  const foot = document.createElement('p');
  foot.className = 'review__date';
  const time = document.createElement('time');
  time.dateTime = date;
  time.textContent = new Date(date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
  foot.append(time);

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'review__delete';
  del.textContent = 'Видалити';
  del.setAttribute('aria-label', `Видалити відгук від ${name}`);
  del.addEventListener('click', () => {
    // BOM: системне діалогове вікно підтвердження
    if (!window.confirm(`Видалити відгук від ${name}?`)) return;
    li.remove();
    saved = saved.filter((r) => r.id !== id);
    storage.set('polonyna:reviews', saved);
    updateSummary();
    formStatus.textContent = 'Відгук видалено.';
    nameInput.focus();
  });
  foot.append(del);

  head.append(h3, starsP);
  article.append(head, textP, foot);
  li.append(article);
  return li;
}

// Відгуки, збережені раніше в цьому браузері
let saved = storage.get('polonyna:reviews', []);
saved.forEach((r) => list.append(createReview(r)));
updateSummary();

// --- Валідація ---
function setError(key, message) {
  const box = form.querySelector(`[data-error-for="${key}"]`);
  box.textContent = message;
  const field = key === 'rating' ? form.querySelector('.rating') : form.querySelector(`#${key}`);
  field.classList.toggle('is-invalid', Boolean(message));
  if (key !== 'rating') field.setAttribute('aria-invalid', String(Boolean(message)));
}

function validateName() {
  const v = nameInput.value.trim();
  if (!v) return setError('review-name', 'Вкажіть ім\'я.'), false;
  if (v.length < 2) return setError('review-name', 'Ім\'я має містити щонайменше 2 літери.'), false;
  setError('review-name', '');
  return true;
}

function validateText() {
  const v = textInput.value.trim();
  if (!v) return setError('review-text', 'Напишіть кілька слів про альбом.'), false;
  if (v.length < 10) return setError('review-text', `Ще ${10 - v.length} симв. до мінімуму в 10 символів.`), false;
  setError('review-text', '');
  return true;
}

function validateRating() {
  const ok = Boolean(form.querySelector('input[name="rating"]:checked'));
  setError('rating', ok ? '' : 'Оберіть оцінку від 1 до 5.');
  return ok;
}

// blur: перевірка, коли користувач залишає поле
nameInput.addEventListener('blur', validateName);
textInput.addEventListener('blur', validateText);

// input: лічильник символів у реальному часі і зняття помилки під час виправлення
textInput.addEventListener('input', () => {
  const len = textInput.value.length;
  textCounter.textContent = `${len} / ${MAX_TEXT}`;
  textCounter.classList.toggle('is-near-limit', len > MAX_TEXT - 30);
  if (textInput.classList.contains('is-invalid')) validateText();
});
nameInput.addEventListener('input', () => {
  if (nameInput.classList.contains('is-invalid')) validateName();
});

// --- Зірки рейтингу: mouseover / mouseout / change ---
function lightStars(value) {
  stars.forEach((star) => star.classList.toggle('is-lit', Number(star.dataset.value) <= value));
}
const checkedValue = () => Number(form.querySelector('input[name="rating"]:checked')?.value || 0);

stars.forEach((star) => {
  star.addEventListener('mouseover', () => lightStars(Number(star.dataset.value)));
  star.addEventListener('mouseout', () => lightStars(checkedValue()));
});
form.querySelectorAll('input[name="rating"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    lightStars(checkedValue());
    validateRating();
  });
});

// --- Відправка форми ---
form.addEventListener('submit', (event) => {
  event.preventDefault(); // блокуємо стандартну відправку і перезавантаження сторінки

  const okName = validateName();
  const okRating = validateRating();
  const okText = validateText();
  if (!(okName && okRating && okText)) {
    formStatus.textContent = 'Виправте позначені поля.';
    const firstBad = form.querySelector('.is-invalid');
    (firstBad.matches('fieldset') ? firstBad.querySelector('input') : firstBad).focus();
    return;
  }

  const review = {
    id: String(Date.now()),
    name: nameInput.value.trim(),
    rating: checkedValue(),
    text: textInput.value.trim(),
    date: new Date().toISOString().slice(0, 10),
  };
  saved.push(review);
  storage.set('polonyna:reviews', saved);

  const node = createReview(review);
  node.classList.add('is-new');
  list.append(node);
  updateSummary();

  form.reset();
  lightStars(0);
  textCounter.textContent = `0 / ${MAX_TEXT}`;
  formStatus.textContent = `Дякуємо, ${review.name}! Відгук додано.`;
  node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// =====================================================================
// 6. BOM: подія scroll і розмір вікна
// =====================================================================
const header = document.querySelector('.site-header');
const toTop = document.querySelector('[data-action="to-top"]');

function onScroll() {
  header.classList.toggle('is-scrolled', window.scrollY > 8);
  // На вузьких екранах кнопка «Вгору» з'являється раніше
  const threshold = window.innerWidth < 600 ? 400 : 700;
  toTop.classList.toggle('is-visible', window.scrollY > threshold);
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

toTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.querySelector('.brand').focus({ preventScroll: true });
});

markCurrent(0);
