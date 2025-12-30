# Настройка Neon PostgreSQL в Railway

## Ваша ситуация

У вас есть:
- **Backend на Railway**
- **PostgreSQL на Neon** (не на Railway!)

Connection string от Neon:
```
postgresql://neondb_owner:npg_YkX7Wm6FNRTU@ep-mute-truth-aejonffm-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

## Решение: Используйте Neon connection string

### Шаг 1: Настройте переменные в Railway

В Railway Dashboard → ваш backend сервис → **Variables**:

1. **Удалите** переменные, связанные с Railway PostgreSQL (если есть):
   - `DATABASE_URL=${{Postgres.DATABASE_URL}}`
   - `DB_HOST=${{Postgres.PGHOST}}`
   - и т.д.

2. **Добавьте** переменную для Neon:
   - **Key:** `DATABASE_URL`
   - **Value:** `postgresql://neondb_owner:npg_YkX7Wm6FNRTU@ep-mute-truth-aejonffm-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require`

   ⚠️ **Важно:** Скопируйте весь connection string целиком!

3. **Альтернативно** (если хотите использовать отдельные переменные):
   - `DB_HOST` = `ep-mute-truth-aejonffm-pooler.c-2.us-east-2.aws.neon.tech`
   - `DB_PORT` = `5432`
   - `DB_NAME` = `neondb`
   - `DB_USER` = `neondb_owner`
   - `DB_PASSWORD` = `npg_YkX7Wm6FNRTU`
   - `DB_SSL` = `require` (или добавьте `?sslmode=require` в connection string)

### Шаг 2: Удалите Railway PostgreSQL (опционально)

Если вы не используете Railway PostgreSQL:
1. В Railway Dashboard найдите PostgreSQL сервис
2. Settings → Delete service
3. Это сэкономит ресурсы

### Шаг 3: Пересоберите backend

Railway автоматически пересоберет backend после изменения переменных.

### Шаг 4: Выполните миграции

В Railway Shell:
```bash
npm run migrate
npm run create-admin admin@example.com admin123
```

## Проверка

После пересборки проверьте логи backend:
- Должно быть: "Database connection established"
- Не должно быть ошибок подключения к БД

## Важные замечания

### SSL/TLS
Neon требует SSL соединение (`sslmode=require`). Убедитесь, что это указано в connection string.

### Pooler vs Direct connection
Ваш connection string использует **pooler** (`-pooler` в URL). Это правильно для production.

Если нужен прямой connection (без pooler):
```
postgresql://neondb_owner:npg_YkX7Wm6FNRTU@ep-mute-truth-aejonffm.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
```
(убрать `-pooler` из URL)

### Расширения PostgreSQL
Neon поддерживает все необходимые расширения:
- ✅ `uuid-ossp` - используется в миграциях
- ✅ Все стандартные функции PostgreSQL

Миграции полностью совместимы с Neon.

### Формат connection string

**Правильный формат:**
```
postgresql://user:password@host:port/database?sslmode=require
```

**Ваш Neon connection string:**
```
postgresql://neondb_owner:npg_YkX7Wm6FNRTU@ep-mute-truth-aejonffm-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

✅ Все правильно!

## Troubleshooting

### Ошибка: "connection refused"
- Проверьте, что connection string правильный
- Убедитесь, что `sslmode=require` указан
- Проверьте, что Neon база данных активна

### Ошибка: "authentication failed"
- Проверьте пароль в connection string
- Убедитесь, что пользователь `neondb_owner` существует

### Ошибка: "database does not exist"
- Проверьте имя базы данных (`neondb`)
- В Neon Dashboard проверьте имя базы

## Пример правильной настройки

**В Railway Variables:**

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_YkX7Wm6FNRTU@ep-mute-truth-aejonffm-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require` |
| `PORT` | `3001` |
| `JWT_SECRET` | `your-secret-key` |
| `NODE_ENV` | `production` |

После этого Railway будет использовать Neon базу данных вместо Railway PostgreSQL.

