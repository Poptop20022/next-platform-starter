# TenderHub

Внутренний веб-сервис для отдела закупок. Система управления тендерами с поддержкой создания, ведения и сравнения коммерческих предложений.

## Возможности

- ✅ CRUD операции для тендеров, лотов, позиций, поставщиков и КП
- ✅ RBAC на уровне тендера (admin, manager, evaluator, viewer)
- ✅ Импорт позиций из Excel (xlsx)
- ✅ Загрузка и хранение файлов (attachments)
- ✅ Таблица сравнения КП по позициям с экспортом в Excel
- ✅ Генерация документов (приглашение, форма КП, протокол) в DOCX и PDF
- ✅ Аудит изменений (кто/когда/что поменял)
- ✅ API документация (OpenAPI/Swagger)

## Технологический стек

- **Backend**: Node.js, Express, TypeScript, PostgreSQL
- **Frontend**: Next.js 16 (App Router), React, Tailwind CSS
- **Database**: PostgreSQL 15
- **Containerization**: Docker Compose

## Структура проекта

```
.
├── backend/              # Backend API
│   ├── src/
│   │   ├── models/      # Модели данных
│   │   ├── routes/      # API endpoints
│   │   ├── middleware/  # Middleware (auth, RBAC, audit)
│   │   ├── services/    # Бизнес-логика
│   │   ├── db/          # Миграции и подключение к БД
│   │   └── config/      # Конфигурация
│   └── package.json
├── app/                 # Next.js frontend
│   ├── tenders/         # Страницы тендеров
│   └── login/           # Страница входа
├── docker-compose.yml    # Docker Compose конфигурация
└── README.md
```

## Быстрый старт

### Предварительные требования

- Docker и Docker Compose
- Node.js 20+ (для локальной разработки без Docker)

### Запуск через Docker Compose

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd next-platform-starter
```

2. Создайте файл `.env` в папке `backend`:
```bash
cd backend
cp .env.example .env
# Отредактируйте .env при необходимости
```

3. Запустите все сервисы:
```bash
docker-compose up -d
```

4. Выполните миграции БД:
```bash
docker-compose exec backend npm run migrate
```

5. Создайте первого пользователя (admin):
```bash
docker-compose exec backend npm run create-admin admin@example.com admin123 "Admin User"
```

Или с параметрами по умолчанию (admin@example.com / admin123):
```bash
docker-compose exec backend npm run create-admin
```

6. Откройте в браузере:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Docs: http://localhost:3001/api-docs

### Локальная разработка (без Docker)

1. Установите PostgreSQL и создайте БД:
```bash
createdb tenderhub
```

2. Установите зависимости backend:
```bash
cd backend
npm install
```

3. Настройте `.env` файл:
```env
DATABASE_URL=postgresql://tenderhub:password@localhost:5432/tenderhub
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tenderhub
DB_USER=tenderhub
DB_PASSWORD=password
PORT=3001
JWT_SECRET=your-secret-key
```

4. Запустите миграции:
```bash
npm run migrate
```

5. Создайте первого пользователя:
```bash
npm run create-admin admin@example.com admin123 "Admin User"
```

6. Запустите backend:
```bash
npm run dev
```

7. В другом терминале установите зависимости frontend и запустите:
```bash
npm install
npm run dev
```

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация пользователя
- `POST /api/auth/login` - Вход в систему
- `GET /api/auth/me` - Текущий пользователь

### Тендеры
- `GET /api/tenders` - Список тендеров
- `GET /api/tenders/:id` - Детали тендера
- `POST /api/tenders` - Создать тендер
- `PUT /api/tenders/:id` - Обновить тендер
- `DELETE /api/tenders/:id` - Удалить тендер
- `POST /api/tenders/:id/roles` - Назначить роль пользователю

### Лоты
- `GET /api/lots/tender/:tenderId` - Лоты тендера
- `GET /api/lots/:id` - Детали лота
- `POST /api/lots` - Создать лот
- `PUT /api/lots/:id` - Обновить лот
- `DELETE /api/lots/:id` - Удалить лот

### Позиции
- `GET /api/positions/lot/:lotId` - Позиции лота
- `GET /api/positions/:id` - Детали позиции
- `POST /api/positions` - Создать позицию
- `POST /api/positions/import/:lotId` - Импорт из Excel
- `PUT /api/positions/:id` - Обновить позицию
- `DELETE /api/positions/:id` - Удалить позицию

### Поставщики
- `GET /api/suppliers` - Список поставщиков
- `GET /api/suppliers/:id` - Детали поставщика
- `POST /api/suppliers` - Создать поставщика
- `PUT /api/suppliers/:id` - Обновить поставщика
- `DELETE /api/suppliers/:id` - Удалить поставщика

### КП (Quotes)
- `GET /api/quotes/tender/:tenderId` - КП тендера
- `GET /api/quotes/lot/:lotId` - КП лота
- `GET /api/quotes/:id` - Детали КП
- `POST /api/quotes` - Создать КП
- `PUT /api/quotes/:id` - Обновить КП
- `POST /api/quotes/:id/submit` - Отправить КП
- `DELETE /api/quotes/:id` - Удалить КП

### Сравнение
- `GET /api/comparison/lot/:lotId` - Данные для сравнения
- `GET /api/comparison/lot/:lotId/export` - Экспорт в Excel

### Документы
- `GET /api/documents/tender/:id/invitation?format=docx|pdf` - Приглашение
- `GET /api/documents/tender/:id/quote-form?format=docx|pdf` - Форма КП
- `GET /api/documents/tender/:id/protocol?format=docx|pdf` - Протокол

### Файлы
- `GET /api/attachments/tender/:tenderId` - Файлы тендера
- `POST /api/attachments` - Загрузить файл
- `GET /api/attachments/:id/download` - Скачать файл
- `DELETE /api/attachments/:id` - Удалить файл

## Роли и права доступа

### Глобальные роли:
- **admin** - Полный доступ ко всем тендерам
- **manager** - Создание и управление тендерами
- **evaluator** - Оценка КП
- **viewer** - Просмотр

### Роли на уровне тендера:
- **admin** - Полное управление тендером
- **manager** - Управление лотами, позициями, КП
- **evaluator** - Оценка КП
- **viewer** - Только просмотр

## Статусы тендера

1. **Draft** - Черновик
2. **CollectingQuotes** - Сбор КП
3. **Evaluation** - Оценка
4. **Decision** - Принятие решения
5. **Closed** - Закрыт

## Примеры использования API

### Создание тендера
```bash
curl -X POST http://localhost:3001/api/tenders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "T-2024-001",
    "title": "Закупка оборудования",
    "description": "Описание тендера",
    "submission_deadline": "2024-12-31T23:59:59Z"
  }'
```

### Импорт позиций из Excel
```bash
curl -X POST http://localhost:3001/api/positions/import/LOT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@positions.xlsx"
```

### Экспорт сравнения КП
```bash
curl -X GET http://localhost:3001/api/comparison/lot/LOT_ID/export \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o comparison.xlsx
```

## Разработка

### Backend
```bash
cd backend
npm run dev        # Запуск в режиме разработки
npm run build      # Сборка
npm run migrate    # Выполнить миграции
npm run lint       # Линтинг
```

### Frontend
```bash
npm run dev        # Запуск в режиме разработки
npm run build      # Сборка
npm run start      # Production режим
```

## Структура БД

Основные таблицы:
- `users` - Пользователи
- `tenders` - Тендеры
- `tender_roles` - Роли пользователей на тендеры
- `lots` - Лоты
- `positions` - Позиции
- `suppliers` - Поставщики
- `quotes` - Коммерческие предложения
- `quote_positions` - Позиции в КП
- `attachments` - Файлы
- `evaluation_criteria` - Критерии оценки
- `quote_evaluations` - Оценки КП
- `audit_logs` - Лог изменений

## Безопасность

- JWT аутентификация
- Хеширование паролей (bcrypt)
- RBAC на уровне тендера
- Валидация входных данных (Zod)
- Аудит всех изменений
- Rate limiting (настроен в middleware)

## Логирование

Логи сохраняются в:
- `backend/logs/combined.log` - Все логи
- `backend/logs/error.log` - Только ошибки
- Консоль в режиме разработки

## Развертывание на Netlify

**⚠️ Важно:** Backend не может работать на Netlify напрямую (требует отдельный хостинг).

**✅ Решение:** Гибридное развертывание
- **Frontend** → Netlify
- **Backend** → Railway или Render  
- **PostgreSQL** → Supabase, Neon, или Railway

**📖 Инструкции:**
- **Быстрый старт:** [NETLIFY_SETUP.md](./NETLIFY_SETUP.md) (3 шага, 10 минут)
- **Подробная инструкция:** [DEPLOY_NETLIFY.md](./DEPLOY_NETLIFY.md)

## Лицензия

Внутренний проект для отдела закупок.
