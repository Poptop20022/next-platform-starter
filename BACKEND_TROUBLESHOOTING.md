# Решение проблемы "Failed to fetch" при подключении к Backend

## Проблема

Вы видите ошибку:
```
❌ Не удалось подключиться к backend: Failed to fetch
```

URL правильный: `https://next-platform-starter-production.up.railway.app`

## Пошаговая диагностика

### Шаг 1: Проверьте доступность Backend в браузере

Откройте в браузере (не через код, а напрямую):
```
https://next-platform-starter-production.up.railway.app/api/health
```

**Ожидаемый результат:**
```json
{"status":"ok","timestamp":"2025-..."}
```

**Если не работает:**
- Backend не запущен или недоступен
- Переходите к шагу 2

**Если работает:**
- Backend доступен, проблема в CORS или настройках frontend
- Переходите к шагу 4

### Шаг 2: Проверьте статус Backend на Railway

1. **Railway Dashboard** → ваш проект
2. Найдите **backend сервис** (Node.js/Web Service)
3. Проверьте статус:
   - ✅ **"Running"** - сервис запущен
   - ❌ **"Stopped"** - сервис остановлен (запустите)
   - ⚠️ **"Building"** - идет сборка (подождите)
   - ❌ **"Failed"** - ошибка сборки (проверьте логи)

### Шаг 3: Проверьте логи Backend

1. **Railway Dashboard** → backend сервис
2. **Deployments** → последний deployment
3. **View Logs**

**Ищите:**
- ✅ `Server running on port 3001`
- ✅ `Database connection established`
- ❌ Ошибки подключения к БД
- ❌ Ошибки при старте

**Частые ошибки:**

**Ошибка подключения к БД:**
```
Database connection failed
```
**Решение:** Проверьте `DATABASE_URL` в Variables (должен быть Neon connection string)

**Ошибка порта:**
```
Port 3001 is already in use
```
**Решение:** Railway автоматически назначает порт, используйте `process.env.PORT`

**Ошибка сборки:**
```
npm ERR! ...
```
**Решение:** Проверьте `package.json` и зависимости

### Шаг 4: Проверьте переменные окружения

**Railway Dashboard** → backend сервис → **Variables**

Должны быть:
- ✅ `DATABASE_URL` = ваш Neon connection string
- ✅ `PORT` = `3001` (или оставьте пустым, Railway назначит автоматически)
- ✅ `JWT_SECRET` = ваш-секретный-ключ
- ✅ `NODE_ENV` = `production`

**Проверьте DATABASE_URL:**
- Должен начинаться с `postgresql://`
- Должен содержать `neon.tech` или ваш провайдер БД
- Должен содержать `sslmode=require`

### Шаг 5: Проверьте CORS

Если backend доступен в браузере, но не работает из frontend - проблема в CORS.

**Проверьте `backend/src/index.ts`:**
- Должен быть ваш Netlify домен в `allowedOrigins`
- Или должен быть паттерн для всех Netlify доменов

**Обновленный код уже включает:**
```typescript
'https://*.netlify.app' // Allow all Netlify subdomains
```

После изменения CORS:
1. Закоммитьте изменения
2. Railway автоматически пересоберет backend
3. Проверьте снова

### Шаг 6: Проверьте миграции

Backend может запускаться, но не работать из-за отсутствия таблиц.

**Railway Dashboard** → backend сервис → **Shell**

Выполните:
```bash
npm run migrate
```

Должно быть: `Migration completed successfully`

### Шаг 7: Проверьте сетевые настройки

**Railway Dashboard** → backend сервис → **Settings** → **Networking**

- ✅ Public Domain должен быть активен
- ✅ Должен быть доступен извне (не только internal)

## Быстрое решение

### Если backend не запущен:

1. **Railway Dashboard** → backend сервис
2. **Settings** → проверьте переменные окружения
3. **Deployments** → **Redeploy** (пересоберите)
4. Дождитесь завершения деплоя
5. Проверьте логи на ошибки

### Если backend запущен, но не отвечает:

1. Проверьте доступность в браузере: `https://your-backend.railway.app/api/health`
2. Если не работает - проверьте логи
3. Если работает - проверьте CORS

### Если CORS проблема:

1. Обновите `backend/src/index.ts` (уже обновлен)
2. Закоммитьте и запушьте
3. Railway пересоберет backend
4. Проверьте снова

## Проверка через curl

Если у вас есть доступ к терминалу:

```bash
# Проверка health endpoint
curl https://next-platform-starter-production.up.railway.app/api/health

# Проверка CORS
curl -H "Origin: https://tehnogrupp.netlify.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://next-platform-starter-production.up.railway.app/api/health \
     -v
```

## Что проверить в первую очередь

1. ✅ Backend доступен в браузере? (`/api/health`)
2. ✅ Backend запущен на Railway? (статус "Running")
3. ✅ Нет ошибок в логах?
4. ✅ DATABASE_URL правильный?
5. ✅ Миграции выполнены?
6. ✅ CORS настроен правильно?

## Если ничего не помогает

1. **Пересоздайте backend сервис:**
   - Удалите старый сервис
   - Создайте новый по инструкции [SETUP_BACKEND_RAILWAY.md](./SETUP_BACKEND_RAILWAY.md)

2. **Проверьте Railway план:**
   - Бесплатный план может иметь ограничения
   - Проверьте квоты и лимиты

3. **Используйте альтернативный хостинг:**
   - Render.com (бесплатный tier)
   - Fly.io (бесплатный tier)
   - Heroku (платный)

