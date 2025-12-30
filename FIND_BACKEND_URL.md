# Как найти правильный Backend URL в Railway

## Проблема

Вы видите в поле URL что-то вроде `tramway.proxy.rlwy.net:29343` - это **НЕ** backend URL!

Это URL базы данных PostgreSQL, а не вашего backend API.

## Решение: Найдите правильный Backend URL

### Шаг 1: Откройте Railway Dashboard

1. Зайдите на https://railway.app
2. Войдите в свой аккаунт
3. Откройте ваш проект

### Шаг 2: Найдите Backend сервис

В списке сервисов найдите ваш **backend сервис** (Node.js приложение):
- Обычно называется: `backend`, `api`, `server`, или имя вашего проекта
- **НЕ** PostgreSQL! (это база данных)

### Шаг 3: Получите Public Domain

1. Кликните на ваш **backend сервис** (не PostgreSQL!)
2. Перейдите в **Settings** (вкладка слева)
3. Прокрутите до раздела **Networking**
4. Найдите **Public Domain**
5. Скопируйте его (например: `tenderhub-production.up.railway.app`)

### Шаг 4: Сформируйте полный URL

Добавьте `https://` в начало:
```
https://tenderhub-production.up.railway.app
```

⚠️ **Важно:** 
- URL должен начинаться с `https://`
- **БЕЗ** слеша в конце
- **БЕЗ** порта (Railway автоматически использует 443 для HTTPS)

### Шаг 5: Введите URL в форму входа

1. На странице входа нажмите "Изменить URL" (если нужно)
2. Введите полный URL: `https://your-backend.railway.app`
3. Нажмите "Проверить подключение"
4. Если проверка успешна, попробуйте войти

## Примеры правильных URL

✅ **Правильно:**
- `https://tenderhub-production.up.railway.app`
- `https://my-api.railway.app`
- `https://backend-abc123.railway.app`

❌ **Неправильно:**
- `tramway.proxy.rlwy.net:29343` (это PostgreSQL proxy)
- `http://localhost:3001` (локальный адрес)
- `your-backend.railway.app` (без https://)
- `https://your-backend.railway.app/` (лишний слеш)

## Проверка

После ввода правильного URL:

1. Нажмите "Проверить подключение"
2. Должно появиться: "✅ Backend доступен!"
3. Теперь можно войти

Если ошибка:
- Проверьте, что backend запущен (Railway Dashboard → Deployments → View Logs)
- Убедитесь, что это правильный URL backend сервиса
- Проверьте, что URL начинается с `https://`

## Если не можете найти Public Domain

Если в Settings → Networking нет Public Domain:

1. Railway может не создавать его автоматически
2. Нажмите **"Generate Domain"** или **"Add Domain"**
3. Railway создаст публичный домен для вашего сервиса

## Альтернатива: Используйте переменную окружения

Вместо ручного ввода URL, настройте в Netlify:

1. Netlify Dashboard → Site settings → Environment variables
2. Добавьте: `NEXT_PUBLIC_API_URL` = `https://your-backend.railway.app`
3. Пересоберите сайт

Тогда URL будет применяться автоматически при каждой сборке.

