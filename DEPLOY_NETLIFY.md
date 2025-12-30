# Развертывание TenderHub на Netlify

## Важные ограничения Netlify

Netlify - это платформа для статических сайтов и serverless функций. Она **не поддерживает**:
- Долгоживущие серверные процессы (как Express backend)
- PostgreSQL базу данных напрямую
- Docker контейнеры

## Решения для развертывания

### Вариант 1: Гибридное развертывание (Рекомендуется)

**Frontend на Netlify, Backend и БД на других сервисах:**

1. **Frontend (Next.js)** → Netlify
2. **Backend API** → Railway, Render, Fly.io, или Heroku
3. **PostgreSQL** → Supabase, Neon, или Railway

#### Шаги:

1. **Разверните Backend на Railway/Render:**
   ```bash
   # На Railway или Render
   - Подключите GitHub репозиторий
   - Укажите root directory: backend
   - Добавьте переменные окружения
   - Деплой автоматический
   ```

2. **Создайте PostgreSQL БД:**
   - **Supabase** (бесплатно): https://supabase.com
   - **Neon** (бесплатно): https://neon.tech
   - **Railway** (бесплатный tier): https://railway.app

3. **Настройте Frontend на Netlify:**
   - Подключите GitHub репозиторий
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Добавьте переменную окружения:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.railway.app
     ```

### Вариант 2: Полностью на Netlify (Serverless)

Конвертировать backend в Netlify Functions (требует рефакторинга).

#### Требования:
- Конвертировать Express routes в Netlify Functions
- Использовать внешнюю БД (Supabase, Neon)
- Адаптировать загрузку файлов под Netlify Blob Storage

## Пошаговая инструкция (Вариант 1 - Рекомендуется)

### Шаг 1: Развертывание Backend на Railway

1. Зарегистрируйтесь на https://railway.app
2. Создайте новый проект
3. Добавьте PostgreSQL сервис
4. Добавьте Node.js сервис:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Добавьте переменные окружения:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_NAME=${{Postgres.PGDATABASE}}
   DB_USER=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   PORT=3001
   JWT_SECRET=your-secret-key-here
   NODE_ENV=production
   ```

6. Выполните миграции:
   ```bash
   railway run npm run migrate
   ```

7. Создайте админа:
   ```bash
   railway run npm run create-admin
   ```

8. Скопируйте URL вашего backend (например: `https://tenderhub-backend.railway.app`)

### Шаг 2: Развертывание Frontend на Netlify

1. Зарегистрируйтесь на https://app.netlify.com
2. Подключите GitHub репозиторий
3. Настройки сборки:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Base directory:** (оставьте пустым)
4. Добавьте переменные окружения:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```
5. Нажмите "Deploy site"
6. После деплоя ваш сайт будет доступен на `https://your-site.netlify.app`

### Шаг 3: Настройка CORS на Backend

Убедитесь, что backend разрешает запросы с Netlify домена:

В `backend/src/index.ts` уже есть CORS middleware, но можно добавить конкретные домены:

```typescript
app.use(cors({
  origin: [
    'https://your-site.netlify.app',
    'https://tehnogrupp.netlify.app',
    'http://localhost:3000'
  ],
  credentials: true
}));
```

### Шаг 4: Настройка домена (опционально)

В Netlify Dashboard:
1. Site settings → Domain management
2. Добавьте кастомный домен или используйте `tehnogrupp.netlify.app`

## Альтернативные платформы для Backend

### Render.com
- Бесплатный tier доступен
- Автоматический деплой из GitHub
- Встроенная PostgreSQL

### Fly.io
- Хорошо подходит для Docker
- Глобальная сеть
- Бесплатный tier

### Heroku
- Классический выбор
- Платный (но есть бесплатные альтернативы)

## Проверка после развертывания

1. Откройте `https://your-site.netlify.app`
2. Проверьте, что frontend загружается
3. Попробуйте войти (создайте пользователя через backend API)
4. Проверьте создание тендера

## Troubleshooting

### Проблема: CORS ошибки
**Решение:** Добавьте Netlify домен в CORS настройки backend

### Проблема: Backend не доступен
**Решение:** Проверьте переменные окружения и URL в `NEXT_PUBLIC_API_URL`

### Проблема: База данных не подключается
**Решение:** Проверьте `DATABASE_URL` и убедитесь, что БД доступна извне

## Мониторинг

- **Netlify:** Логи доступны в Dashboard → Functions
- **Railway:** Логи в реальном времени в Dashboard
- **Backend:** Winston логи (если настроены)

## Обновление

После каждого push в GitHub:
- Netlify автоматически пересоберет frontend
- Railway автоматически пересоберет backend (если настроен)

## Стоимость

- **Netlify:** Бесплатно (100GB bandwidth, 300 build minutes)
- **Railway:** $5/месяц (или бесплатно с ограничениями)
- **Supabase PostgreSQL:** Бесплатно (500MB БД)

