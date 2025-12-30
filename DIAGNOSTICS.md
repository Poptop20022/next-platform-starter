# Диагностика проблем подключения

## Быстрая диагностика

Откройте страницу диагностики:
```
https://your-site.netlify.app/test-connection
```

Эта страница автоматически проверит:
- ✅ Формат URL
- ✅ Доступность backend
- ✅ Существование endpoints
- ✅ CORS настройки
- ✅ Переменные окружения

## Интерпретация результатов

### ❌ HTTP 404 на /api/auth/login

**Возможные причины:**

1. **Backend не запущен**
   - Проверьте логи в Railway Dashboard
   - Убедитесь, что сервис в статусе "Running"

2. **Неправильный URL**
   - Проверьте, что URL начинается с `https://`
   - Убедитесь, что нет лишних слешей
   - Проверьте, что это правильный Railway URL

3. **Маршруты не зарегистрированы**
   - Проверьте, что `setupRoutes(app)` вызывается в `backend/src/index.ts`
   - Проверьте логи backend на наличие ошибок при старте

4. **Backend работает на другом порту**
   - Проверьте переменную `PORT` в Railway
   - Railway автоматически назначает порт, но проверьте настройки

## Пошаговая проверка

### Шаг 1: Проверьте доступность backend

Откройте в браузере:
```
https://your-backend.railway.app/api/health
```

**Ожидаемый результат:**
```json
{"status":"ok","timestamp":"2024-..."}
```

**Если не работает:**
- Backend не запущен → проверьте Railway Dashboard
- 404 → проверьте URL
- CORS ошибка → проверьте настройки CORS

### Шаг 2: Проверьте auth endpoint

Откройте в браузере (или через curl):
```
https://your-backend.railway.app/api/auth/login
```

**Ожидаемый результат:**
- Если POST с телом → ошибка валидации (но не 404!)
- Если GET → может быть 404 или 405 (Method Not Allowed)

**Если 404:**
- Маршрут не зарегистрирован
- Проверьте `backend/src/routes/index.ts`
- Проверьте, что `app.use('/api/auth', authRoutes)` вызывается

### Шаг 3: Проверьте логи backend

В Railway Dashboard:
1. Откройте ваш backend сервис
2. Перейдите в "Deployments" → "View Logs"
3. Ищите ошибки при старте
4. Проверьте, что видно сообщение "Server running on port..."

### Шаг 4: Проверьте переменные окружения

В Railway Dashboard:
1. Backend сервис → Variables
2. Убедитесь, что есть:
   - `DATABASE_URL` или `DB_HOST`, `DB_PORT`, etc.
   - `PORT` (Railway может автоматически назначить)
   - `JWT_SECRET`
   - `NODE_ENV`

### Шаг 5: Проверьте миграции

В Railway Shell выполните:
```bash
npm run migrate
```

Убедитесь, что миграции выполнены без ошибок.

## Частые проблемы и решения

### Проблема: Backend возвращает 404 на все endpoints

**Решение:**
1. Проверьте логи backend - возможно ошибка при старте
2. Убедитесь, что `setupRoutes(app)` вызывается ДО `app.listen()`
3. Проверьте, что нет ошибок импорта в `backend/src/routes/index.ts`

### Проблема: Backend работает локально, но не на Railway

**Решение:**
1. Проверьте переменные окружения в Railway
2. Проверьте, что `NODE_ENV=production` не блокирует что-то
3. Проверьте логи на Railway - могут быть ошибки подключения к БД

### Проблема: CORS ошибки

**Решение:**
1. Добавьте ваш Netlify домен в `allowedOrigins` в `backend/src/index.ts`
2. Пересоберите backend после изменения
3. Проверьте, что CORS middleware применяется ДО routes

## Проверка через curl

```bash
# Health check
curl https://your-backend.railway.app/api/health

# Auth endpoint (должен вернуть ошибку валидации, не 404)
curl -X POST https://your-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
```

## Что делать дальше

1. Запустите диагностическую страницу: `/test-connection`
2. Скопируйте результаты тестов
3. Проверьте логи backend в Railway
4. Сравните с ожидаемыми результатами выше

Если проблема не решена, пришлите:
- Результаты тестов с `/test-connection`
- Логи backend из Railway
- URL вашего backend

