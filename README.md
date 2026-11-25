# «Полонина» — сторінка музичного альбому (Практичні роботи №3, 3.1, 4)

CSS Grid-макет (header, sidebar, main, footer, player), трек-лист на `<table>` з `rowspan`/`colspan`, глобальний `<audio controls>` з двома `<source>` (Opus і MP3), адаптивна обкладинка `<picture>` + WebP `srcset`, галерея релізів з `loading="lazy"`, inline SVG, `transition` на hover і три анімації `@keyframes` (fade-up, еквалайзер, pulse).

**Студент:** Дудка Назарій, ІПЗс-24-1, Університет Короля Данила

Усі файли лежать в одній папці; музика й обкладинки згенеровані для навчального проєкту.

## ПР3.1 — веб-типографіка
- Google Fonts через `<link>`: **Manrope** (основний текст) і **Montserrat** (навігація, кнопки, бейджі).
- Локальний шрифт **Bitter** (OFL) через `@font-face` з папки `fonts/` для заголовків H1–H3 і логотипа.
- Кожен `font-family` має стек відкату із загальним сімейством у кінці.
- `--lh-body: 1.6`, `--ls-caps: 1px` — змінні в `:root`.

## ПР4 — DOM, події, BOM
- `app.js` підключено в `<head>` з `defer`.
- Відгуки: `<form>` + `submit` з `preventDefault()`, перевірка на `blur`/`input`, зірки на `mouseover`/`mouseout`/`change`, нові відгуки створюються через `createElement` + `textContent`.
- Модальне вікно «Поділитися» (`classList`, Escape і Tab через `keydown`), перемикач теми (`classList.toggle`), лічильник лайків, гарячі клавіші плеєра (Пробіл, ← →).
- BOM: `window.addEventListener('scroll')`, `window.innerWidth`, `window.matchMedia`, `window.localStorage`, `window.confirm`, `location.href`, `navigator.clipboard`, `navigator.share`.
