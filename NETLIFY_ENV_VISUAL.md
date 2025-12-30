# Настройка NEXT_PUBLIC_API_URL в Netlify - Визуальная инструкция

## Шаг 1: Откройте Netlify Dashboard

1. Зайдите на https://app.netlify.com
2. Войдите в свой аккаунт
3. Выберите ваш сайт (например: `tehnogrupp`)

## Шаг 2: Перейдите в Environment Variables

В меню слева найдите и нажмите:
**Site settings** → прокрутите вниз до раздела **Build & deploy** → **Environment variables**

Или просто:
**Site settings** → **Environment variables** (в левом меню)

## Шаг 3: Добавьте переменную

1. Нажмите кнопку **"Add a variable"** или **"Add variable"**

2. В появившейся форме заполните:
   ```
   Key:   NEXT_PUBLIC_API_URL
   Value: https://your-backend.railway.app
   ```

   ⚠️ **ВАЖНО:**
   - Key должен быть точно: `NEXT_PUBLIC_API_URL` (с префиксом `NEXT_PUBLIC_`)
   - Value должен быть полным URL вашего backend (начинается с `https://`)
   - **БЕЗ слеша в конце!** (не `https://...railway.app/`)

3. В поле **Scopes** оставьте "All scopes" или выберите "Production"

4. Нажмите **"Save"** или **"Add variable"**

## Шаг 4: ОБЯЗАТЕЛЬНО пересоберите сайт!

⚠️ **КРИТИЧЕСКИ ВАЖНО:** Переменные окружения применяются только при сборке!

1. В верхнем меню нажмите **"Deploys"**

2. Нажмите кнопку **"Trigger deploy"** (или три точки → "Trigger deploy")

3. Выберите **"Clear cache and deploy site"**

4. Дождитесь завершения сборки (обычно 2-3 минуты)

## Шаг 5: Проверка

После пересборки:

1. Откройте ваш сайт
2. Откройте страницу входа
3. Внизу страницы должно быть видно правильный API URL
4. Попробуйте войти

## Если все еще не работает

### Вариант 1: Временное решение через страницу входа

На странице входа теперь есть возможность ввести API URL вручную:

1. Откройте страницу входа
2. Нажмите "Изменить URL" внизу
3. Введите URL вашего backend
4. Нажмите "Проверить подключение"
5. Если проверка успешна, попробуйте войти

### Вариант 2: Проверьте переменную

1. Netlify Dashboard → Site settings → Environment variables
2. Убедитесь, что переменная `NEXT_PUBLIC_API_URL` есть в списке
3. Проверьте, что значение правильное (начинается с `https://`)

### Вариант 3: Проверьте последний deploy

1. Netlify Dashboard → Deploys
2. Откройте последний deploy
3. Убедитесь, что он был создан **ПОСЛЕ** добавления переменной
4. Если нет - пересоберите сайт

## Пример правильной настройки

**В Netlify Environment Variables должно быть:**

| Key | Value | Scopes |
|-----|-------|--------|
| `NEXT_PUBLIC_API_URL` | `https://tenderhub-production.up.railway.app` | All scopes |

✅ **Правильно:**
- `https://tenderhub-production.up.railway.app`

❌ **Неправильно:**
- `https://tenderhub-production.up.railway.app/` (лишний слеш)
- `http://tenderhub-production.up.railway.app` (без s)
- `tenderhub-production.up.railway.app` (без протокола)
- `NEXT_PUBLIC_API_URL` написано с ошибкой

## Проверка через консоль браузера

Откройте консоль (F12) и выполните:

```javascript
// В Next.js переменные с NEXT_PUBLIC_ доступны только при сборке
// Но можно проверить через localStorage (если вводили вручную)
console.log('Saved API URL:', localStorage.getItem('api_url'))

// Проверка подключения
fetch('https://your-backend-url.railway.app/api/health')
  .then(r => r.json())
  .then(data => console.log('✅ Backend доступен:', data))
  .catch(err => console.error('❌ Ошибка:', err))
```

## Частые ошибки

1. **Переменная добавлена, но сайт не пересобран**
   → Решение: Обязательно пересоберите сайт после добавления переменной!

2. **Неправильное имя переменной**
   → Должно быть точно: `NEXT_PUBLIC_API_URL` (с префиксом `NEXT_PUBLIC_`)

3. **URL с лишним слешем**
   → Не должно быть слеша в конце: `https://...railway.app` (не `/`)

4. **Используется http вместо https**
   → Всегда используйте `https://` для production

