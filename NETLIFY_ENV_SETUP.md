# Настройка NEXT_PUBLIC_API_URL в Netlify

## Пошаговая инструкция

### Шаг 1: Получите URL вашего Backend

В Railway Dashboard:
1. Откройте ваш **backend сервис**
2. Перейдите в **Settings** → **Networking**
3. Скопируйте **Public Domain** (например: `tenderhub-production.up.railway.app`)
4. Полный URL будет: `https://tenderhub-production.up.railway.app`

⚠️ **Важно:** URL должен начинаться с `https://` и **БЕЗ слеша** в конце!

### Шаг 2: Добавьте переменную в Netlify

1. Откройте Netlify Dashboard: https://app.netlify.com
2. Выберите ваш сайт (например: `tehnogrupp`)
3. В меню слева нажмите **Site settings**
4. Прокрутите вниз до раздела **Environment variables**
5. Нажмите **Add a variable**
6. Заполните:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://your-backend-url.railway.app` (URL из шага 1)
   - **Scopes:** оставьте "All scopes" или выберите "Production"
7. Нажмите **Save**

### Шаг 3: Пересоберите сайт

⚠️ **КРИТИЧЕСКИ ВАЖНО:** После добавления переменной окружения нужно пересобрать сайт!

1. В Netlify Dashboard перейдите в **Deploys**
2. Нажмите **Trigger deploy** → **Clear cache and deploy site**
3. Дождитесь завершения сборки (обычно 2-3 минуты)

### Шаг 4: Проверка

1. После пересборки откройте ваш сайт
2. Откройте консоль браузера (F12)
3. На странице входа должно быть видно правильный API URL (если включен debug mode)
4. Попробуйте войти:
   - Email: `admin@example.com`
   - Password: `admin123`

## Пример правильной настройки

**В Netlify Environment Variables:**

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://tenderhub-production.up.railway.app` |

✅ **Правильно:**
- `https://tenderhub-production.up.railway.app`

❌ **Неправильно:**
- `https://tenderhub-production.up.railway.app/` (лишний слеш)
- `http://tenderhub-production.up.railway.app` (без https)
- `tenderhub-production.up.railway.app` (без протокола)

## Troubleshooting

### Проблема: Переменная не применяется

**Решение:**
1. Убедитесь, что вы **пересобрали сайт** после добавления переменной
2. Проверьте, что переменная называется точно `NEXT_PUBLIC_API_URL` (с префиксом `NEXT_PUBLIC_`)
3. Очистите кеш браузера (Ctrl+Shift+R)

### Проблема: Все еще показывает localhost

**Решение:**
1. Убедитесь, что сайт пересобран после добавления переменной
2. Проверьте в Netlify Deploys, что последний deploy был после добавления переменной
3. Попробуйте очистить кеш Netlify: Deploys → Trigger deploy → Clear cache

### Проблема: CORS ошибка

**Решение:**
1. Убедитесь, что ваш Netlify домен добавлен в CORS на backend
2. В `backend/src/index.ts` должен быть ваш домен в `allowedOrigins`
3. Пересоберите backend после изменения CORS

## Проверка через консоль браузера

Откройте консоль (F12) и выполните:
```javascript
// Проверка переменной (работает только в development)
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)

// Проверка подключения к backend
fetch('https://your-backend-url.railway.app/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Если видите `undefined` → переменная не настроена или сайт не пересобран.

