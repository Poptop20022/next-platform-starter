# Развертывание на Netlify - Краткая инструкция

## ⚠️ Важно: Backend не может работать на Netlify

Netlify поддерживает только статические сайты и serverless функции. Ваш Express backend требует отдельного хостинга.

## ✅ Решение: Гибридное развертывание

**Frontend (Next.js)** → Netlify  
**Backend (Express)** → Railway или Render  
**База данных** → Supabase, Neon, или Railway PostgreSQL

---

## 🚀 Быстрый деплой (3 шага)

### 1️⃣ Backend на Railway (5 минут)

1. Зайдите на https://railway.app
2. "New Project" → "Deploy from GitHub repo"
3. Выберите ваш репозиторий
4. Railway автоматически найдет `backend/` папку
5. Добавьте PostgreSQL:
   - Нажмите "+ New" → "Database" → "PostgreSQL"
6. В настройках backend сервиса добавьте переменные:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   PORT=3001
   JWT_SECRET=ваш-секретный-ключ
   NODE_ENV=production
   ```
7. Скопируйте URL backend (например: `https://tenderhub.up.railway.app`)

### 2️⃣ Миграции и админ

В Railway Dashboard → ваш backend → "Shell":
```bash
npm run migrate
npm run create-admin admin@example.com admin123
```

### 3️⃣ Frontend на Netlify (3 минуты)

1. Зайдите на https://app.netlify.com
2. "Add new site" → "Import an existing project"
3. Выберите ваш GitHub репозиторий
4. Настройки (обычно определяются автоматически):
   - Build command: `npm run build`
   - Publish directory: `.next`
5. **Важно:** Добавьте переменную окружения:
   - Site settings → Environment variables
   - `NEXT_PUBLIC_API_URL` = `https://ваш-backend.railway.app`
6. Deploy!

---

## 🎉 Готово!

Ваш сайт: `https://your-site.netlify.app`  
Вход: `admin@example.com` / `admin123`

---

## 🔄 Обновление

После каждого `git push`:
- Netlify автоматически пересоберет frontend
- Railway автоматически пересоберет backend

---

## 💡 Альтернативы

**Backend хостинг:**
- Railway (рекомендуется) - https://railway.app
- Render - https://render.com (бесплатно)
- Fly.io - https://fly.io

**База данных:**
- Supabase PostgreSQL - https://supabase.com (бесплатно)
- Neon - https://neon.tech (бесплатно)
- Railway PostgreSQL (встроено)

---

## 🆘 Проблемы?

**CORS ошибки?**  
Backend уже настроен для Netlify доменов. Если нужно добавить свой домен, отредактируйте `backend/src/index.ts`

**Backend не отвечает?**  
Проверьте логи в Railway Dashboard и переменные окружения

**Frontend не видит API?**  
Убедитесь, что `NEXT_PUBLIC_API_URL` правильно настроен в Netlify

---

Подробная инструкция: см. [DEPLOY_NETLIFY.md](./DEPLOY_NETLIFY.md)

