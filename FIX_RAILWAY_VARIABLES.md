# Исправление переменных окружения в Railway

## Проблема

В Railway Dashboard переменные окружения содержат **placeholder значения**, а не реальные:

- ❌ `DATABASE_URL` = `ваш-connection-string-из-Neon` (это не работает!)
- ❌ `JWT_SECRET` = `your-secret-key` (это не работает!)

## Решение

### Шаг 1: Получите реальный Neon Connection String

1. **Откройте Neon Dashboard:**
   - https://console.neon.tech
   - Войдите в аккаунт

2. **Выберите ваш проект**

3. **Выберите базу данных**

4. **Connection Details** → **Connection string**

5. **Скопируйте connection string:**
   ```
   postgresql://neondb_owner:npg_YkX7Wm6FNRTU@ep-mute-truth-aejonffm-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
   ```
   ⚠️ **Используйте ваш реальный connection string!**

### Шаг 2: Сгенерируйте JWT_SECRET

**Вариант 1: Онлайн генератор**
- Откройте: https://generate-secret.vercel.app/32
- Скопируйте сгенерированный ключ

**Вариант 2: Через терминал**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Вариант 3: Используйте любой длинный случайный ключ**
- Минимум 32 символа
- Пример: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

### Шаг 3: Обновите переменные в Railway

1. **Railway Dashboard** → ваш проект
2. Найдите сервис **"next-platform-starter"** (backend)
3. **Variables** (вкладка)
4. **Измените каждую переменную:**

   **DATABASE_URL:**
   - Кликните на `DATABASE_URL`
   - Удалите: `ваш-connection-string-из-Neon`
   - Вставьте ваш реальный Neon connection string
   - Сохраните

   **JWT_SECRET:**
   - Кликните на `JWT_SECRET`
   - Удалите: `your-secret-key`
   - Вставьте сгенерированный секретный ключ
   - Сохраните

5. **Проверьте остальные переменные:**
   - ✅ `NODE_ENV` = `production` (правильно)
   - ✅ `PORT` = `3001` (правильно)
   - ✅ `NEXT_PUBLIC_API_URL` = `https://next-platform-starter-production.up.railway.app` (если обрезано, проверьте полный URL)

### Шаг 4: Railway автоматически пересоберет

После изменения переменных:
- Railway автоматически пересоберет backend
- Дождитесь завершения деплоя (2-3 минуты)
- Проверьте логи на ошибки

### Шаг 5: Проверьте логи

1. **Railway Dashboard** → backend сервис
2. **Deployments** → последний deployment
3. **View Logs**

**Ищите:**
- ✅ `Server running on port 3001`
- ✅ `Database connection established`
- ❌ Ошибки подключения к БД (если есть - проверьте DATABASE_URL)

### Шаг 6: Проверьте доступность

Откройте в браузере:
```
https://next-platform-starter-production.up.railway.app/api/health
```

Должен вернуться:
```json
{"status":"ok","timestamp":"2025-..."}
```

## Важно: Не используйте Railway PostgreSQL!

На скриншоте видно, что у вас есть Railway PostgreSQL сервис. Но вы должны использовать **Neon**!

**Если хотите использовать Neon (рекомендуется):**
- ✅ Используйте Neon connection string в `DATABASE_URL`
- ❌ Игнорируйте Railway PostgreSQL (можно удалить, если не нужен)

**Если хотите использовать Railway PostgreSQL:**
- Используйте Railway PostgreSQL connection string в `DATABASE_URL`
- Но тогда не нужен Neon

## Итоговые переменные должны быть:

```
DATABASE_URL = postgresql://neondb_owner:npg_...@ep-mute-truth-aejonffm-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
JWT_SECRET = ваш-длинный-случайный-ключ-минимум-32-символа
NODE_ENV = production
PORT = 3001
NEXT_PUBLIC_API_URL = https://next-platform-starter-production.up.railway.app
```

## После исправления

1. ✅ Backend пересоберется автоматически
2. ✅ Проверьте логи на ошибки
3. ✅ Проверьте доступность: `/api/health`
4. ✅ Попробуйте войти на странице входа

## Troubleshooting

### Ошибка: "Database connection failed"
- Проверьте, что `DATABASE_URL` правильный (Neon connection string)
- Проверьте, что Neon база данных активна
- Проверьте SSL настройки (`sslmode=require`)

### Ошибка: "JWT_SECRET is not defined"
- Проверьте, что `JWT_SECRET` задан
- Убедитесь, что это не placeholder

### Backend не запускается
- Проверьте логи на ошибки
- Убедитесь, что все переменные правильные
- Попробуйте пересобрать вручную (Redeploy)

