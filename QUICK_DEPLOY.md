# Быстрое развертывание TenderHub на Netlify

## 🚀 Быстрый старт (5 минут)

### Шаг 1: Backend на Railway (2 минуты)

1. Откройте https://railway.app и войдите через GitHub
2. Нажмите "New Project" → "Deploy from GitHub repo"
3. Выберите ваш репозиторий
4. Railway автоматически определит `backend` директорию
5. Добавьте PostgreSQL:
   - Нажмите "+ New" → "Database" → "PostgreSQL"
6. Добавьте переменные окружения в настройках backend сервиса:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   PORT=3001
   JWT_SECRET=your-super-secret-key-change-this
   NODE_ENV=production
   ```
7. Скопируйте URL вашего backend (например: `https://tenderhub-production.up.railway.app`)

### Шаг 2: Выполните миграции

В Railway Dashboard:
1. Откройте ваш backend сервис
2. Перейдите в "Deployments" → "View Logs"
3. Откройте "Shell" и выполните:
   ```bash
   npm run migrate
   npm run create-admin admin@example.com admin123
   ```

### Шаг 3: Frontend на Netlify (2 минуты)

1. Откройте https://app.netlify.com и войдите через GitHub
2. Нажмите "Add new site" → "Import an existing project"
3. Выберите ваш репозиторий
4. Настройки сборки (Netlify определит автоматически):
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
5. Добавьте переменную окружения:
   - Нажмите "Site settings" → "Environment variables"
   - Добавьте: `NEXT_PUBLIC_API_URL` = `https://your-backend.railway.app` (URL из шага 1)
6. Нажмите "Deploy site"

### Шаг 4: Готово! 🎉

Ваш сайт будет доступен на `https://your-site-name.netlify.app`

Войдите с:
- Email: `admin@example.com`
- Password: `admin123`

## 🔧 Альтернатива: Render.com

Если Railway не подходит, используйте Render:

1. Откройте https://render.com
2. Создайте "New Web Service" из GitHub репозитория
3. Укажите:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Добавьте PostgreSQL database
5. Добавьте переменные окружения (как в Railway)

## 📝 Важные замечания

- **Backend НЕ может работать на Netlify** - используйте Railway/Render/Fly.io
- **PostgreSQL** должна быть внешней (Supabase, Neon, Railway, Render)
- **CORS** уже настроен в backend для работы с Netlify доменами
- **Файлы** сохраняются локально на backend сервере (для production используйте S3)

## 🆘 Проблемы?

### CORS ошибки
Добавьте ваш Netlify URL в `allowedOrigins` в `backend/src/index.ts`

### Backend не отвечает
Проверьте:
1. Переменные окружения в Railway/Render
2. Логи в Dashboard
3. `DATABASE_URL` правильный

### Frontend не подключается к API
Проверьте:
1. `NEXT_PUBLIC_API_URL` в Netlify настройках
2. URL начинается с `https://`
3. Backend доступен (откройте URL в браузере)

## 💰 Стоимость

- **Netlify:** Бесплатно (100GB трафика)
- **Railway:** $5/месяц (или бесплатно с ограничениями)
- **Render:** Бесплатно (с ограничениями)
- **Supabase PostgreSQL:** Бесплатно (500MB)

## 🔄 Обновление

После каждого push в GitHub:
- Netlify автоматически пересоберет frontend
- Railway/Render автоматически пересоберет backend

