# Исправление ошибки Node.js версии в Netlify

## Проблема

Netlify использует Node.js 18.20.5, а Next.js 16 требует >= 20.9.0.

Ошибка:
```
You are using Node.js 18.20.5. For Next.js, Node.js version ">=20.9.0" is required.
```

## Решение

### 1. Обновлен netlify.toml

Добавлена явная версия Node.js:
```toml
[build.environment]
  NODE_VERSION = "20.18.0"
```

### 2. Создан .nvmrc

Файл `.nvmrc` указывает версию Node.js для локальной разработки и некоторых CI/CD систем.

### 3. Добавлен engines в package.json

Указаны минимальные требования:
```json
"engines": {
  "node": ">=20.9.0",
  "npm": ">=10.0.0"
}
```

## Что делать дальше

1. **Закоммитьте изменения:**
   ```bash
   git add netlify.toml .nvmrc package.json
   git commit -m "Fix Node.js version for Netlify build"
   git push
   ```

2. **Netlify автоматически пересоберет** с новой версией Node.js

3. **Проверьте сборку** в Netlify Dashboard → Deploys

## Альтернатива: Настройка в Netlify Dashboard

Если изменения в netlify.toml не работают:

1. Netlify Dashboard → Site settings
2. Build & deploy → Environment
3. Добавьте переменную:
   - **Key:** `NODE_VERSION`
   - **Value:** `20.18.0`
4. Пересоберите сайт

## Проверка

После пересборки в логах должно быть:
```
Using Node.js version 20.18.0
```

Вместо:
```
Using Node.js version 18.20.5
```

## Поддерживаемые версии Node.js в Netlify

Netlify поддерживает:
- Node.js 18.x
- Node.js 20.x ✅ (используем эту)
- Node.js 22.x (если доступно)

Указание `NODE_VERSION = "20.18.0"` гарантирует использование Node.js 20.

