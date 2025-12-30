# Отладка проблемы 404 с роутами

## Проблема

Роут `/api/auth/login` возвращает 404, хотя код выглядит правильно.

## Диагностика

### Шаг 1: Проверьте логи backend на Railway

1. **Railway Dashboard** → backend сервис
2. **Deployments** → последний deployment
3. **View Logs**

**Ищите:**
- ✅ `Setting up routes...`
- ✅ `✓ Auth routes registered at /api/auth`
- ✅ `Routes setup completed`
- ✅ `Available API endpoints:`
- ❌ `Error setting up routes:` (если видите - есть ошибка при регистрации)
- ❌ `Failed to setup routes:` (если видите - роуты не зарегистрированы)

### Шаг 2: Проверьте, что все файлы роутов существуют

Убедитесь, что все эти файлы существуют:
- ✅ `backend/src/routes/auth.ts`
- ✅ `backend/src/routes/tenders.ts`
- ✅ `backend/src/routes/index.ts`

### Шаг 3: Проверьте импорты

**Файл `backend/src/routes/auth.ts` должен экспортировать:**
```typescript
export const authRoutes = Router();
```

**Файл `backend/src/routes/index.ts` должен импортировать:**
```typescript
import { authRoutes } from './auth.js';
```

### Шаг 4: Проверьте сборку

**Railway Dashboard** → backend сервис → **Deployments** → последний deployment

**Проверьте build logs:**
- ✅ `npm install` - успешно
- ✅ `npm run build` - успешно (TypeScript компиляция)
- ✅ `npm start` - успешно
- ❌ Ошибки компиляции TypeScript
- ❌ Ошибки при импорте модулей

### Шаг 5: Проверьте через Swagger

Откройте в браузере:
```
https://next-platform-starter-production.up.railway.app/api-docs
```

**Если Swagger открывается:**
- Backend работает
- Проверьте список роутов в Swagger UI
- Должен быть `/api/auth/login`

**Если Swagger не открывается:**
- Backend не запущен или есть ошибка
- Проверьте логи

## Возможные причины

### 1. Код не закоммичен/не запушен

**Решение:**
```bash
git add backend/
git commit -m "Add route logging"
git push
```

Railway автоматически пересоберет после push.

### 2. Ошибка при импорте роутов

**Проверьте логи:**
- Если видите `Error setting up routes:` - есть ошибка
- Проверьте, что все файлы роутов существуют
- Проверьте синтаксис в файлах роутов

### 3. TypeScript не компилируется

**Проверьте build logs:**
- Ошибки компиляции TypeScript
- Отсутствующие типы
- Неправильные импорты

### 4. Backend не пересобрался

**Решение:**
1. Railway Dashboard → backend сервис
2. **Deployments** → **Redeploy**
3. Дождитесь завершения

## Быстрое решение

1. **Закоммитьте и запушьте изменения:**
   ```bash
   git add backend/
   git commit -m "Fix routes and add logging"
   git push
   ```

2. **Дождитесь автоматического деплоя на Railway**

3. **Проверьте логи:**
   - Должны быть логи `Setting up routes...`
   - Должны быть логи `✓ Auth routes registered`

4. **Проверьте доступность:**
   ```
   https://next-platform-starter-production.up.railway.app/api/auth/login
   ```

## Если ничего не помогает

1. **Проверьте, что backend действительно запущен:**
   - Railway Dashboard → статус должен быть "Running"
   - Логи должны показывать `Server running on port...`

2. **Попробуйте пересоздать сервис:**
   - Удалите backend сервис
   - Создайте новый по инструкции [SETUP_BACKEND_RAILWAY.md](./SETUP_BACKEND_RAILWAY.md)

3. **Проверьте переменные окружения:**
   - `DATABASE_URL` правильный?
   - `JWT_SECRET` задан?
   - `PORT` правильный?

