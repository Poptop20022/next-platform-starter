# Быстрое исправление "API URL не настроен"

## Проблема
Вы видите ошибку: "API URL не настроен. Пожалуйста, настройте NEXT_PUBLIC_API_URL в Netlify Environment Variables."

## Решение за 3 шага

### ✅ Шаг 1: Настройте DATABASE_URL в Railway

1. **Railway Dashboard** → ваш **backend сервис** (Node.js, не PostgreSQL!)
2. **Variables** → **+ New Variable**
3. Добавьте:
   - **Key:** `DATABASE_URL`
   - **Value:** `${{Postgres.DATABASE_URL}}`
   
   ⚠️ **Важно:** Замените `Postgres` на точное имя вашего PostgreSQL сервиса (посмотрите в Railway Dashboard)

4. Также добавьте:
   - `PORT` = `3001`
   - `JWT_SECRET` = `ваш-длинный-секретный-ключ`
   - `NODE_ENV` = `production`

5. Railway автоматически пересоберет backend

### ✅ Шаг 2: Получите URL Backend

1. **Railway Dashboard** → ваш backend сервис
2. **Settings** → **Networking**
3. Скопируйте **Public Domain** (например: `tenderhub-production.up.railway.app`)
4. Полный URL: `https://tenderhub-production.up.railway.app`

### ✅ Шаг 3: Настройте NEXT_PUBLIC_API_URL в Netlify

1. **Netlify Dashboard** → ваш сайт
2. **Site settings** → **Environment variables**
3. **Add a variable:**
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://your-backend-url.railway.app` (из шага 2, БЕЗ слеша в конце!)
4. **Save**

5. **ВАЖНО:** Пересоберите сайт:
   - **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

### ✅ Шаг 4: Выполните миграции (после того как backend пересоберется)

1. **Railway Dashboard** → backend сервис → **Shell**
2. Выполните:
   ```bash
   npm run migrate
   npm run create-admin admin@example.com admin123
   ```

## Проверка

1. Откройте: `https://your-backend-url.railway.app/api/health`
   - Должен вернуться: `{"status":"ok",...}`

2. Откройте ваш Netlify сайт
3. Попробуйте войти:
   - Email: `admin@example.com`
   - Password: `admin123`

## Если не работает

### Проверьте имя PostgreSQL сервиса

В Railway Dashboard посмотрите точное имя вашего PostgreSQL сервиса. Оно может быть:
- `Postgres`
- `postgres`
- `PostgreSQL`
- `database`
- и т.д.

Используйте это имя в `${{ИмяСервиса.DATABASE_URL}}`

### Проверьте логи

**Railway:**
- Backend сервис → **Deployments** → **View Logs**

**Netlify:**
- Site → **Functions** → **Logs**

### Проверьте переменные

**Railway:**
- Backend сервис → **Variables** → убедитесь, что все переменные добавлены

**Netlify:**
- Site settings → **Environment variables** → убедитесь, что `NEXT_PUBLIC_API_URL` есть

## Чек-лист

- [ ] DATABASE_URL добавлен в Railway backend сервис
- [ ] PORT, JWT_SECRET, NODE_ENV добавлены в Railway
- [ ] Backend пересобран в Railway
- [ ] Backend доступен по URL (проверьте /api/health)
- [ ] NEXT_PUBLIC_API_URL добавлен в Netlify
- [ ] Netlify сайт пересобран после добавления переменной
- [ ] Миграции выполнены
- [ ] Пользователь создан

После выполнения всех пунктов вход должен работать! 🎉

