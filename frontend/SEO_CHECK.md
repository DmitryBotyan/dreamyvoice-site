# Как проверить SEO-метаданные в браузере

## 1. Просмотр исходного кода страницы

### Chrome/Edge/Firefox:
1. Откройте страницу сайта (например, `http://localhost:3000`)
2. Нажмите `Ctrl+U` (или `Cmd+Option+U` на Mac) или правой кнопкой → "Просмотр кода страницы"
3. Найдите в `<head>`:
   - `<title>` — заголовок страницы
   - `<meta name="description">` — описание
   - `<meta property="og:title">` — Open Graph заголовок
   - `<meta property="og:description">` — Open Graph описание
   - `<meta property="og:image">` — Open Graph изображение
   - `<meta name="twitter:card">` — Twitter Card
   - `<link rel="canonical">` — канонический URL
   - `<script type="application/ld+json">` — JSON-LD структурированные данные

## 2. Инструменты разработчика (DevTools)

### Chrome/Edge:
1. Откройте DevTools: `F12` или `Ctrl+Shift+I` (или `Cmd+Option+I` на Mac)
2. Перейдите на вкладку **Elements** (Элементы)
3. В дереве элементов найдите `<head>`
4. Разверните его и проверьте все мета-теги

### Проверка через консоль:
Откройте консоль (`F12` → вкладка Console) и выполните:

```javascript
// Проверка title
console.log(document.title);

// Проверка meta description
console.log(document.querySelector('meta[name="description"]')?.content);

// Проверка Open Graph
console.log(document.querySelector('meta[property="og:title"]')?.content);
console.log(document.querySelector('meta[property="og:image"]')?.content);

// Проверка JSON-LD
const jsonLd = document.querySelector('script[type="application/ld+json"]');
if (jsonLd) {
  console.log(JSON.parse(jsonLd.textContent));
}
```

## 3. Онлайн-инструменты для проверки

### Open Graph:
- **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
  - Вставьте URL страницы и нажмите "Отладка"
  - Покажет, как страница будет выглядеть при шаринге в Facebook

### Twitter Cards:
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
  - Вставьте URL и проверьте превью карточки

### Общие SEO-проверки:
- **Google Rich Results Test**: https://search.google.com/test/rich-results
  - Проверяет структурированные данные (JSON-LD)
- **Schema.org Validator**: https://validator.schema.org/
  - Валидация JSON-LD разметки

## 4. Проверка конкретных страниц

### Главная страница (`/`):
```bash
curl http://localhost:3000 | grep -E '<title>|<meta name="description"|<meta property="og:'
```

### Страница тайтла (`/titles/[slug]`):
1. Откройте любой тайтл на сайте
2. Проверьте, что:
   - Title содержит название тайтла
   - Description содержит описание тайтла и количество серий
   - Open Graph image — это обложка тайтла
   - JSON-LD содержит тип `TVSeries`

## 5. Быстрая проверка через браузер

### Chrome Extension:
- **SEO META in 1 CLICK**: расширение для быстрого просмотра всех мета-тегов

### Проверка в Network tab:
1. Откройте DevTools → вкладка **Network**
2. Обновите страницу (`F5`)
3. Найдите запрос к HTML-документу
4. Откройте его → вкладка **Preview** или **Response**
5. Проверьте `<head>` секцию

## 6. Проверка JSON-LD структурированных данных

В консоли браузера выполните:

```javascript
// Найти все JSON-LD скрипты
const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
jsonLdScripts.forEach((script, index) => {
  console.log(`JSON-LD #${index + 1}:`, JSON.parse(script.textContent));
});
```

## 7. Проверка через curl (терминал)

```bash
# Получить HTML страницы
curl http://localhost:3000 > page.html

# Извлечь мета-теги
grep -E '<title>|<meta' page.html | head -20

# Извлечь JSON-LD
grep -A 50 'application/ld+json' page.html
```

## Что должно быть на странице тайтла:

✅ `<title>Название тайтла | DreamyVoice</title>`
✅ `<meta name="description" content="Описание с количеством серий">`
✅ `<meta property="og:title" content="Название тайтла | DreamyVoice">`
✅ `<meta property="og:image" content="http://localhost:3000/media/covers/...">`
✅ `<meta name="twitter:card" content="summary_large_image">`
✅ `<link rel="canonical" href="http://localhost:3000/titles/...">`
✅ `<script type="application/ld+json">` с типом `TVSeries`

## Что должно быть на главной странице:

✅ `<title>DreamyVoice — Каталог аниме в озвучке команды</title>`
✅ `<meta name="description" content="Смотрите аниме...">`
✅ `<meta property="og:type" content="website">`
✅ JSON-LD с типами `Organization` и `WebSite`

