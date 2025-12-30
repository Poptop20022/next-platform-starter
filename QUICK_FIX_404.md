# Быстрое решение HTTP 404 при входе

## Проблема

Backend доступен (`/api/health` работает), но:
```
POST /api/auth/login → HTTP 404
```

## Решение за 3 шага

### Шаг 1: Проверьте, что код закоммичен

Убедитесь, что все изменения в `backend/src/` закоммичены и запушены в Git:

```bash
git add backend/
git commit -m "Fix routes"
git push
```

### Шаг 2: Пересоберите backend на Railway

1. **Railway Dashboard** → backend сервис "next-platform-starter"
2. **Deployments** → **Redeploy** (или подождите автоматического деплоя)
3. Дождитесь завершения (2-3 минуты)
4. Проверьте статус: должен быть "Running"

### Шаг 3: Проверьте логи

1. **Railway Dashboard** → backend сервис
2. **Deployments** → последний deployment
3. **View Logs**

**Ищите:**
- ✅ `Server running on port 3001`
- ✅ `Registered routes:` (должны быть логи о зарегистрированных роутах)
- ❌ `Route not found: POST /api/auth/login` (если видите - роут не зарегистрирован)

## Проверка через браузер

Откройте в браузере (или используйте curl):
```
https://next-platform-starter-production.up.railway.app/api-docs
```

Должна открыться Swagger документация с роутами, включая `/api/auth/login`.

## Если не помогает

1. **Проверьте Network tab:**
   - F12 → Network
   - Попробуйте войти
   - Найдите запрос к `/api/auth/login`
   - Посмотрите полный URL и статус

2. **Проверьте через curl:**
   ```bash
   curl -X POST https://next-platform-starter-production.up.railway.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"admin123"}'
   ```

3. **Проверьте миграции:**
   - Railway Dashboard → backend сервис → Shell
   - Выполните: `npm run migrate`
   - Выполните: `npm run create-admin admin@example.com admin123`

## Частая причина

**Backend не пересобрался после изменений в коде.**

Решение: **Redeploy** в Railway Dashboard.

