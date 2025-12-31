# Исправление ошибки "next: не найдено" на Render

## Проблема
```
sh: 1: next: не найдено
```

Это означает, что пакет `next` не установлен, потому что команда `npm install` не выполняется перед `npm run build`.

## Решение

### Вариант 1: Через веб-интерфейс Render (Быстро)

1. Откройте https://dashboard.render.com
2. Войдите в свой аккаунт
3. Выберите ваш **Frontend сервис** (или создайте новый, если еще нет)

4. Перейдите в **Settings** → **Build & Deploy**

5. Найдите поле **Build Command** и измените его на:
   ```
   npm install && npm run build
   ```

6. Убедитесь, что **Start Command** установлен:
   ```
   npm start
   ```

7. Нажмите **Save Changes**

8. Перейдите в **Manual Deploy** → **Deploy latest commit**

9. Дождитесь завершения деплоя (2-5 минут)

---

### Вариант 2: Использовать render.yaml (Автоматически)

Файл `render.yaml` уже обновлен в проекте. Если вы используете его:

1. Убедитесь, что файл `render.yaml` в корне репозитория
2. В Render Dashboard:
   - Создайте новый сервис через **New +** → **Blueprint**
   - Подключите ваш GitHub репозиторий
   - Render автоматически найдет `render.yaml` и применит настройки

---

## Правильные настройки для Frontend на Render

### Для Next.js Web Service:

| Настройка | Значение |
|-----------|----------|
| **Environment** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Root Directory** | (оставьте пустым, если проект в корне) |

### Переменные окружения:

Добавьте в **Environment**:
- `NEXT_PUBLIC_API_URL` = `https://ваш-backend.railway.app` (или другой backend URL)
- `NODE_ENV` = `production`

---

## Проверка после деплоя

1. Проверьте логи в Render Dashboard → ваш сервис → **Logs**
2. Должно быть:
   ```
   ✅ npm install completed
   ✅ npm run build completed
   ✅ Server running on port...
   ```

3. Откройте ваш сайт - должен загрузиться без ошибок

---

## Если проблема сохраняется

1. **Убедитесь, что Node.js версия правильная:**
   - В `package.json` указано: `"node": ">=20.9.0"`
   - Render автоматически использует правильную версию

2. **Очистите кэш:**
   - Settings → Advanced → **Clear build cache**
   - Перезапустите деплой

3. **Проверьте логи:**
   - Settings → **View Logs**
   - Ищите ошибки установки зависимостей

---

## Альтернатива: Использовать npm ci вместо npm install

В Build Command можно использовать:
```
npm ci && npm run build
```

`npm ci` быстрее и более надежен для production сборок (требует `package-lock.json`).

