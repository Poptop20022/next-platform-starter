# Настройка Backend на Railway - Пошаговая инструкция

## Шаг 1: Настройка DATABASE_URL в Backend сервисе

1. В Railway Dashboard откройте ваш **backend сервис** (не PostgreSQL, а именно Node.js сервис)

2. Перейдите в **Variables** (вкладка слева)

3. Нажмите **+ New Variable**

4. Добавьте переменную:
   - **Key:** `DATABASE_URL`
   - **Value:** `${{Postgres.DATABASE_URL}}`
   
   ⚠️ **Важно:** Скопируйте точно так, как написано: `${{Postgres.DATABASE_URL}}`
   - Где `Postgres` - это имя вашего PostgreSQL сервиса (может быть `Postgres`, `postgres`, `PostgreSQL` и т.д.)
   - Проверьте точное имя вашего PostgreSQL сервиса в Railway Dashboard

5. Также добавьте остальные переменные:
   - **PORT** = `3001`
   - **JWT_SECRET** = `ваш-секретный-ключ-минимум-32-символа`
   - **NODE_ENV** = `production`
   - **DB_HOST** = `${{Postgres.PGHOST}}`
   - **DB_PORT** = `${{Postgres.PGPORT}}`
   - **DB_NAME** = `${{Postgres.PGDATABASE}}`
   - **DB_USER** = `${{Postgres.PGUSER}}`
   - **DB_PASSWORD** = `${{Postgres.PGPASSWORD}}`

6. Сохраните переменные

7. Railway автоматически пересоберет сервис после добавления переменных

## Шаг 2: Проверка имени PostgreSQL сервиса

Если `${{Postgres.DATABASE_URL}}` не работает:

1. Посмотрите на имя вашего PostgreSQL сервиса в Railway Dashboard
2. Оно может быть: `Postgres`, `postgres`, `PostgreSQL`, `database` и т.д.
3. Используйте точное имя, например:
   - Если сервис называется `postgres` → `${{postgres.DATABASE_URL}}`
   - Если `database` → `${{database.DATABASE_URL}}`

## Шаг 3: Выполнение миграций

После того как backend пересоберется:

1. В Railway Dashboard откройте ваш backend сервис
2. Перейдите в **Deployments**
3. Откройте последний deployment
4. Нажмите **View Logs** или **Shell**
5. В Shell выполните:
   ```bash
   npm run migrate
   ```
6. Если миграции успешны, создайте пользователя:
   ```bash
   npm run create-admin admin@example.com admin123 "Admin User"
   ```

## Шаг 4: Получение URL Backend

1. В Railway Dashboard откройте ваш backend сервис
2. Перейдите в **Settings** → **Networking**
3. Скопируйте **Public Domain** (например: `tenderhub-production.up.railway.app`)
4. Или создайте кастомный домен

## Шаг 5: Проверка работы Backend

Откройте в браузере:
```
https://your-backend-url.railway.app/api/health
```

Должен вернуться:
```json
{"status":"ok","timestamp":"2024-..."}
```

## Troubleshooting

### Проблема: Переменные не применяются

**Решение:**
1. Убедитесь, что вы добавили переменные в **backend сервис**, а не в PostgreSQL
2. Проверьте точное имя PostgreSQL сервиса
3. Пересоберите вручную: Deployments → Redeploy

### Проблема: DATABASE_URL пустой

**Решение:**
1. Проверьте, что PostgreSQL сервис запущен
2. Проверьте имя сервиса (должно совпадать с `${{ИмяСервиса.DATABASE_URL}}`)
3. Попробуйте использовать отдельные переменные:
   - `DB_HOST=${{Postgres.PGHOST}}`
   - `DB_PORT=${{Postgres.PGPORT}}`
   - и т.д.

### Проблема: Backend не запускается

**Решение:**
1. Проверьте логи в Railway Dashboard
2. Убедитесь, что все переменные окружения добавлены
3. Проверьте, что миграции выполнены

