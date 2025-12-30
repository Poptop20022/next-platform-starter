# Настройка API URL в Netlify - Простая инструкция

## Проблема
На странице входа показывается `http://localhost:3001` вместо URL вашего backend.

## Решение

### Шаг 1: Получите URL вашего Backend

В Railway Dashboard:
1. Откройте ваш backend сервис
2. Settings → Networking
3. Скопируйте **Public Domain** (например: `tenderhub-production.up.railway.app`)
4. Полный URL: `https://tenderhub-production.up.railway.app`

### Шаг 2: Добавьте переменную в Netlify

1. Откройте https://app.netlify.com
2. Выберите ваш сайт (`tehnogrupp`)
3. **Site settings** (в меню слева)
4. Прокрутите до **Environment variables**
5. Нажмите **"Add a variable"**
6. Заполните:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://your-backend.railway.app` (URL из шага 1)
7. Нажмите **Save**

### Шаг 3: Пересоберите сайт

⚠️ **ВАЖНО:** Переменные применяются только при сборке!

**Вариант А: Автоматически (рекомендуется)**
- Сделайте любой commit и push в GitHub
- Netlify автоматически пересоберет сайт с новой переменной

**Вариант Б: Вручную**
1. В Netlify Dashboard → **Deploys**
2. Нажмите **"Trigger deploy"**
3. Выберите **"Clear cache and deploy site"**

### Шаг 4: Проверка

После пересборки:
1. Откройте https://tehnogrupp.netlify.app/login
2. Должен показываться правильный API URL (не localhost)
3. Попробуйте войти

## Если не работает

### Проверьте переменную
1. Netlify → Site settings → Environment variables
2. Убедитесь, что `NEXT_PUBLIC_API_URL` есть в списке
3. Проверьте значение (должно начинаться с `https://`)

### Проверьте последний deploy
1. Netlify → Deploys
2. Откройте последний deploy
3. Убедитесь, что он был создан **ПОСЛЕ** добавления переменной

### Временное решение
На странице входа можно ввести URL вручную - он сохранится в браузере.

## Пример

**В Netlify Environment Variables:**
```
NEXT_PUBLIC_API_URL = https://tenderhub-production.up.railway.app
```

После следующего деплоя (автоматического или ручного) переменная будет применена.

