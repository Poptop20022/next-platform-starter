# Руководство по развертыванию TenderHub

## 🎯 Краткий обзор вариантов

Ваш проект состоит из 3 частей:
1. **Frontend** (Next.js) - интерфейс пользователя
2. **Backend** (Express API) - серверная логика
3. **База данных** (PostgreSQL) - хранение данных

**⚠️ Важно:** Backend и БД нужно разворачивать отдельно, они не могут работать на статическом хостинге!

---

## 🚀 Вариант 1: Cloudflare Pages (Рекомендуется) ⭐

Проект уже настроен для Cloudflare Pages!

### Frontend на Cloudflare Pages

#### Через командную строку:
```bash
# 1. Установите зависимости
npm install

# 2. Соберите проект
npm run build

# 3. Задеплойте
npm run deploy
```

#### Через веб-интерфейс:
1. Зайдите на https://dash.cloudflare.com
2. Pages → Create a project
3. Connect to Git (GitHub)
4. Настройки сборки:
   - **Build command:** `npm run build`
   - **Output directory:** `.vercel/output/static`
   - **Root directory:** (оставьте пустым)
5. Добавьте переменную окружения:
   - `NEXT_PUBLIC_API_URL` = URL вашего backend (см. ниже)

### Backend и БД:
- **Backend:** Railway или Render (см. раздел ниже)
- **База данных:** Neon, Supabase или Railway PostgreSQL

---

## 🌐 Вариант 2: Netlify + Railway

### Frontend на Netlify

1. Зайдите на https://app.netlify.com
2. "Add new site" → "Import an existing project"
3. Выберите ваш GitHub репозиторий
4. Настройки сборки:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
5. Добавьте переменную окружения:
   - `NEXT_PUBLIC_API_URL` = URL вашего backend

### Backend и БД:
См. раздел "Настройка Backend" ниже

**📖 Подробная инструкция:** [NETLIFY_SETUP.md](./NETLIFY_SETUP.md)

---

## 🔧 Настройка Backend (для любого варианта)

### Backend на Railway (Рекомендуется)

1. Зайдите на https://railway.app
2. "New Project" → "Deploy from GitHub repo"
3. Выберите ваш репозиторий
4. Railway автоматически найдет папку `backend/`
5. Добавьте PostgreSQL:
   - "+ New" → "Database" → "PostgreSQL"
6. В настройках backend сервиса добавьте переменные:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   PORT=3001
   JWT_SECRET=ваш-секретный-ключ-минимум-32-символа
   NODE_ENV=production
   ```
7. Скопируйте URL backend (например: `https://tenderhub.up.railway.app`)

**📖 Подробная инструкция:** [SETUP_BACKEND_RAILWAY.md](./SETUP_BACKEND_RAILWAY.md)

### Backend на Render (Альтернатива)

1. Зайдите на https://render.com
2. "New +" → "Web Service"
3. Подключите GitHub репозиторий
4. Настройки:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Добавьте переменные окружения (аналогично Railway)
6. Скопируйте URL backend

---

## 🗄️ Настройка базы данных

### Вариант A: Railway PostgreSQL (Проще всего)

- Создается вместе с backend на Railway
- Используется: `DATABASE_URL=${{Postgres.DATABASE_URL}}`

### Вариант B: Neon (Бесплатно, рекомендую)

1. Зарегистрируйтесь на https://neon.tech
2. Создайте проект
3. Скопируйте connection string
4. Добавьте в backend переменную:
   ```
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   ```

**📖 Подробная инструкция:** [NEON_SETUP.md](./NEON_SETUP.md)

### Вариант C: Supabase (Бесплатно)

1. Зарегистрируйтесь на https://supabase.com
2. Создайте проект
3. Settings → Database → Connection string
4. Добавьте в backend переменную `DATABASE_URL`

---

## ✅ После развертывания Backend

### 1. Выполните миграции БД

В Railway Dashboard → ваш backend → Shell:
```bash
npm run migrate
```

### 2. Создайте администратора

```bash
npm run create-admin admin@example.com admin123
```

### 3. Скопируйте URL backend

Railway Dashboard → backend → Settings → Networking → Public Domain

### 4. Добавьте URL в Frontend

В настройках вашего frontend (Cloudflare Pages/Netlify) добавьте:
- Переменная: `NEXT_PUBLIC_API_URL`
- Значение: `https://ваш-backend.railway.app` (БЕЗ слеша в конце!)

---

## 🔍 Проверка работы

1. **Frontend:** Откройте ваш сайт (например: `https://your-site.pages.dev`)
2. **Backend:** Откройте `https://your-backend.railway.app/api/health`
   - Должен вернуться: `{"status":"ok","timestamp":"..."}`
3. **Вход:** Попробуйте войти с учетными данными: `admin@example.com` / `admin123`

---

## 💰 Стоимость (бесплатные тарифы)

- **Cloudflare Pages:** Бесплатно (неограниченные запросы, 500 builds/месяц)
- **Netlify:** Бесплатно (100GB bandwidth, 300 build minutes)
- **Railway:** $5/месяц или бесплатно с ограничениями
- **Render:** Бесплатно (с ограничениями)
- **Neon:** Бесплатно (0.5GB БД, 1 проект)
- **Supabase:** Бесплатно (500MB БД)

---

## 🆘 Нужна помощь?

- **Найти Backend URL:** [HOW_TO_FIND_BACKEND_URL.md](./HOW_TO_FIND_BACKEND_URL.md)
- **Архитектура проекта:** [ARCHITECTURE_EXPLAINED.md](./ARCHITECTURE_EXPLAINED.md)
- **Решение проблем:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Диагностика:** [DIAGNOSTICS.md](./DIAGNOSTICS.md)

---

## 📝 Быстрая шпаргалка

```bash
# Локальная разработка
docker-compose up -d
docker-compose exec backend npm run migrate
docker-compose exec backend npm run create-admin

# Frontend (Cloudflare Pages)
npm install
npm run build
npm run deploy

# Frontend (Netlify) - автоматически через Git push
git push origin main
```

