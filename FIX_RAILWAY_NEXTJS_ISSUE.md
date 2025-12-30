# Решение проблемы: Railway развернул Next.js вместо Express Backend

## Проблема

OPTIONS запрос к `/api/auth/login` возвращает 404, и в заголовках видно:
- `x-powered-by: Next.js` (должно быть Express!)
- `server: railway-edge`
- `x-nextjs-cache: HIT`

Это означает, что Railway развернул **Next.js приложение** вместо **Express backend**.

## Причина

Railway автоматически определил неправильный root directory или тип проекта.

## Решение

### Шаг 1: Проверьте настройки сервиса на Railway

1. **Railway Dashboard** → ваш проект
2. Найдите сервис **"next-platform-starter"** (или похожий)
3. **Settings** → **Source**

**Проверьте:**
- **Root Directory:** должно быть `backend` (НЕ пусто или `./`)
- **Build Command:** должно быть `npm install && npm run build`
- **Start Command:** должно быть `npm start`

### Шаг 2: Исправьте Root Directory

1. **Railway Dashboard** → backend сервис
2. **Settings** → **Source**
3. **Root Directory:** измените на `backend`
4. Сохраните

### Шаг 3: Проверьте Build & Deploy настройки

1. **Settings** → **Build & Deploy**
2. **Build Command:** `npm install && npm run build`
3. **Start Command:** `npm start`
4. **Watch Paths:** можно оставить пустым или указать `backend/**`

### Шаг 4: Пересоберите сервис

1. **Deployments** → **Redeploy**
2. Дождитесь завершения (2-3 минуты)
3. Проверьте логи

### Шаг 5: Проверьте логи

**Railway Dashboard** → backend сервис → **Deployments** → **View Logs**

**Ищите:**
- ✅ `Server running on port 3001` (Express)
- ✅ `Setting up routes...`
- ❌ `Next.js` или `next dev` (это неправильно!)

**Если видите Next.js:**
- Root Directory неправильный
- Пересоздайте сервис с правильным root directory

## Альтернативное решение: Пересоздайте сервис

Если настройки не помогают:

### Вариант 1: Удалите и создайте заново

1. **Railway Dashboard** → backend сервис
2. **Settings** → **Delete Service**
3. Создайте новый сервис:
   - **+ New** → **GitHub Repo**
   - Выберите ваш репозиторий
   - **Root Directory:** `backend`
   - Railway автоматически определит настройки

### Вариант 2: Создайте через Empty Service

1. **+ New** → **Empty Service**
2. **Settings** → **Source**:
   - **GitHub** → выберите репозиторий
   - **Root Directory:** `backend`
3. **Settings** → **Build & Deploy**:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

## Проверка после исправления

### 1. Проверьте логи

Должны быть:
```
Server running on port 3001
Setting up routes...
✓ Auth routes registered at /api/auth
```

**НЕ должно быть:**
```
Next.js
next dev
```

### 2. Проверьте доступность

Откройте в браузере:
```
https://next-platform-starter-production.up.railway.app/api/health
```

**Ожидаемый ответ:**
```json
{"status":"ok","timestamp":"2025-..."}
```

**НЕ должно быть:**
- HTML страница Next.js
- 404 от Next.js

### 3. Проверьте заголовки

В Network tab проверьте заголовки ответа:
- ✅ `x-powered-by: Express` (или отсутствует)
- ❌ `x-powered-by: Next.js` (неправильно!)

## Важно: Разделение Frontend и Backend

**Frontend (Next.js):**
- Должен быть на **Netlify**
- Root: корень проекта (или `./`)
- Build: `npm run build`
- Start: `npm start` (для Netlify не нужен)

**Backend (Express):**
- Должен быть на **Railway**
- Root: `backend/`
- Build: `npm install && npm run build`
- Start: `npm start`

## Если всё ещё не работает

1. **Проверьте, что у вас два отдельных сервиса:**
   - Один для frontend (если нужен на Railway)
   - Один для backend (обязательно!)

2. **Убедитесь, что backend сервис использует правильный root:**
   - Root Directory: `backend`
   - НЕ корень проекта!

3. **Проверьте package.json:**
   - В `backend/package.json` должен быть `"main": "dist/index.js"`
   - Start command должен запускать `node dist/index.js`

## Быстрая проверка

После исправления:

1. ✅ Логи показывают `Server running on port 3001`
2. ✅ `/api/health` возвращает JSON (не HTML)
3. ✅ Заголовки не содержат `x-powered-by: Next.js`
4. ✅ OPTIONS запрос обрабатывается (не 404)

