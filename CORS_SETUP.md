# Настройка CORS на Backend

## Что такое CORS?

CORS (Cross-Origin Resource Sharing) - механизм безопасности браузера, который разрешает или блокирует запросы с одного домена к другому.

**В вашем случае:**
- **Frontend:** `https://tehnogrupp.netlify.app` (Netlify)
- **Backend:** `https://next-platform-starter-production.up.railway.app` (Railway)

Браузер блокирует запросы между разными доменами, если CORS не настроен правильно.

## Текущая настройка CORS

CORS уже настроен в `backend/src/index.ts`. Проверьте, что настройки правильные:

### Файл: `backend/src/index.ts`

```typescript
// CORS configuration - allow Netlify domains
const allowedOrigins = [
  'http://localhost:3000',                    // Локальная разработка
  'https://tehnogrupp.netlify.app',          // Ваш Netlify домен
  'https://*.netlify.app',                    // Все Netlify поддомены
  process.env.NETLIFY_SITE_URL,               // Из переменных окружения
  process.env.FRONTEND_URL,                   // Из переменных окружения
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check exact match
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check Netlify subdomain pattern
    if (origin.includes('.netlify.app')) {
      return callback(null, true);
    }
    
    // Development mode - allow all
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, log but allow for now (можно ужесточить позже)
    logger.warn(`CORS request from unknown origin: ${origin}`);
    callback(null, true); // Temporarily allow all origins for debugging
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Проверка настройки

### 1. Убедитесь, что ваш Netlify домен в списке

**Текущий домен:** `https://tehnogrupp.netlify.app`

Он должен быть в `allowedOrigins` или соответствовать паттерну `.netlify.app`.

### 2. Проверьте переменные окружения (опционально)

В Railway можно добавить переменные для более гибкой настройки:

**Railway Dashboard** → backend сервис → **Variables**:

```
FRONTEND_URL = https://tehnogrupp.netlify.app
NETLIFY_SITE_URL = https://tehnogrupp.netlify.app
```

### 3. Проверьте логи на CORS ошибки

**Railway Dashboard** → backend сервис → **Deployments** → **View Logs**

**Ищите:**
- `CORS request from unknown origin: ...` - запросы с неизвестных доменов
- CORS ошибки в логах

## Если CORS не работает

### Проблема: "CORS policy blocked"

**Решение 1: Добавьте ваш домен явно**

В `backend/src/index.ts` добавьте ваш точный домен:

```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'https://tehnogrupp.netlify.app',  // ← Ваш домен
  'https://*.netlify.app',
  // ...
];
```

**Решение 2: Временно разрешите все домены (для отладки)**

Текущая настройка уже разрешает все домены в production (для отладки). Если нужно ужесточить:

```typescript
// Строгая проверка (только для production)
if (process.env.NODE_ENV === 'production') {
  if (origin.includes('.netlify.app')) {
    return callback(null, true);
  }
  callback(new Error('Not allowed by CORS'));
} else {
  callback(null, true);
}
```

### Проблема: OPTIONS запросы не проходят

**Решение:** Убедитесь, что `OPTIONS` в списке методов:

```typescript
methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // ← OPTIONS должен быть
```

### Проблема: Credentials не работают

**Решение:** Убедитесь, что `credentials: true`:

```typescript
credentials: true,  // ← Должно быть true для работы с cookies/tokens
```

## Тестирование CORS

### Вариант 1: Через браузер (DevTools)

1. Откройте страницу входа: `https://tehnogrupp.netlify.app/login`
2. Откройте DevTools (F12) → **Network**
3. Попробуйте войти
4. Найдите запрос к `/api/auth/login`
5. Проверьте заголовки:
   - **Request Headers:** `Origin: https://tehnogrupp.netlify.app`
   - **Response Headers:** `Access-Control-Allow-Origin: https://tehnogrupp.netlify.app`

### Вариант 2: Через curl

```bash
curl -X OPTIONS https://next-platform-starter-production.up.railway.app/api/auth/login \
  -H "Origin: https://tehnogrupp.netlify.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Ожидаемый результат:**
```
< HTTP/1.1 204 No Content
< Access-Control-Allow-Origin: https://tehnogrupp.netlify.app
< Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
< Access-Control-Allow-Credentials: true
```

## Текущий статус

✅ CORS уже настроен и должен работать:
- Разрешает все Netlify домены (`.netlify.app`)
- Разрешает ваш конкретный домен (`tehnogrupp.netlify.app`)
- Временно разрешает все домены для отладки
- Поддерживает credentials (для JWT токенов)
- Поддерживает все необходимые методы

## Если всё ещё не работает

1. **Проверьте, что изменения закоммичены:**
   ```bash
   git add backend/src/index.ts
   git commit -m "Update CORS settings"
   git push
   ```

2. **Дождитесь пересборки backend на Railway**

3. **Проверьте логи на ошибки CORS**

4. **Проверьте Network tab в браузере:**
   - Какой Origin отправляется?
   - Какой ответ приходит от сервера?
   - Есть ли CORS ошибки в консоли?

## Безопасность (для production)

После отладки рекомендуется ужесточить CORS:

```typescript
// Строгая проверка только разрешенных доменов
if (process.env.NODE_ENV === 'production') {
  if (allowedOrigins.includes(origin) || origin.includes('.netlify.app')) {
    return callback(null, true);
  }
  logger.warn(`CORS blocked: ${origin}`);
  callback(new Error('Not allowed by CORS'));
} else {
  callback(null, true); // Development - allow all
}
```

