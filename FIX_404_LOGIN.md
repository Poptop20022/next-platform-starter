# Решение проблемы HTTP 404 при входе

## Проблема

Backend доступен (`/api/health` работает), но при попытке входа:
```
POST /api/auth/login → HTTP 404
```

## Возможные причины

### 1. Backend не пересобрался после изменений

**Решение:**
1. **Railway Dashboard** → backend сервис
2. **Deployments** → **Redeploy** (или подождите автоматического деплоя)
3. Дождитесь завершения (2-3 минуты)
4. Проверьте логи на ошибки

### 2. Роут не зарегистрирован

**Проверьте:**
- `backend/src/routes/index.ts` - должен быть `app.use('/api/auth', authRoutes)`
- `backend/src/routes/auth.ts` - должен быть роут `authRoutes.post('/login', ...)`

### 3. Проблема с путями в production

**Проверьте логи:**
1. **Railway Dashboard** → backend сервис
2. **Deployments** → последний deployment
3. **View Logs**

**Ищите:**
- ✅ `Server running on port...`
- ✅ `Route not found: POST /api/auth/login` (если видите это - роут не зарегистрирован)
- ❌ Ошибки при импорте роутов

### 4. Проблема с CORS preflight

Иногда браузер делает OPTIONS запрос перед POST, и если он не обрабатывается, может быть 404.

**Проверьте:**
- В Network tab браузера (F12) посмотрите, какой именно запрос возвращает 404
- Это POST `/api/auth/login` или OPTIONS?

## Пошаговая диагностика

### Шаг 1: Проверьте доступность роута напрямую

Откройте в браузере (или используйте curl/Postman):
```
POST https://next-platform-starter-production.up.railway.app/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Если работает:**
- Проблема в frontend (возможно, неправильный URL или CORS)

**Если не работает:**
- Проблема в backend (роут не зарегистрирован или не пересобрался)

### Шаг 2: Проверьте логи backend

**Railway Dashboard** → backend сервис → **Deployments** → **View Logs**

**Ищите:**
- `POST /api/auth/login` - должен быть в логах при попытке входа
- `Route not found: POST /api/auth/login` - роут не найден
- Ошибки при старте сервера

### Шаг 3: Проверьте структуру роутов

**Файл `backend/src/routes/index.ts`:**
```typescript
export function setupRoutes(app: Express) {
  app.use('/api/auth', authRoutes);  // ← Должно быть
  // ...
}
```

**Файл `backend/src/routes/auth.ts`:**
```typescript
export const authRoutes = Router();

authRoutes.post('/login', async (req, res, next) => {  // ← Должно быть
  // ...
});
```

### Шаг 4: Пересоберите backend

1. **Railway Dashboard** → backend сервис
2. **Deployments** → **Redeploy**
3. Дождитесь завершения
4. Проверьте логи

### Шаг 5: Проверьте миграции

Если таблица `users` не существует, роут может не работать.

**Railway Dashboard** → backend сервис → **Shell**

Выполните:
```bash
npm run migrate
```

## Быстрое решение

### Вариант 1: Пересоберите backend

1. **Railway Dashboard** → backend сервис
2. **Deployments** → **Redeploy**
3. Дождитесь завершения
4. Попробуйте войти снова

### Вариант 2: Проверьте через curl/Postman

Проверьте, работает ли роут напрямую:

```bash
curl -X POST https://next-platform-starter-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

**Если работает:**
- Проблема в frontend (CORS или неправильный запрос)

**Если не работает:**
- Проблема в backend (роут не зарегистрирован)

### Вариант 3: Проверьте Network tab

1. Откройте страницу входа
2. Откройте DevTools (F12) → **Network**
3. Попробуйте войти
4. Найдите запрос к `/api/auth/login`
5. Посмотрите:
   - Какой метод (POST или OPTIONS)?
   - Какой URL (полный)?
   - Какой статус (404 или другой)?
   - Что в Response?

## Если ничего не помогает

1. **Проверьте, что код закоммичен и запушен:**
   - Все изменения в `backend/src/routes/` должны быть в Git
   - Railway должен видеть последние изменения

2. **Проверьте build logs:**
   - Railway Dashboard → backend сервис
   - Deployments → последний deployment
   - Проверьте, нет ли ошибок при сборке

3. **Попробуйте пересоздать сервис:**
   - Удалите backend сервис
   - Создайте новый по инструкции [SETUP_BACKEND_RAILWAY.md](./SETUP_BACKEND_RAILWAY.md)

