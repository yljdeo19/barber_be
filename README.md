# Barber Booking API

Небольшой, но законченный backend сервиса записи для барбершопа. Проект показывает модульную архитектуру NestJS, работу с PostgreSQL через Prisma, ролевой доступ и корректную обработку конкурентной записи.

## Что реализовано

- авторизация через Redis-сессии и роли `CLIENT`, `SPECIALIST`, `ADMIN`;
- CRUD услуг (удаление мягкое — услуга становится неактивной);
- создание специалистов и настройка их недельного расписания;
- расчёт свободных слотов с шагом 30 минут;
- создание, просмотр и отмена записи;
- календарь записей для администратора и специалиста;
- Swagger по адресу `http://localhost:3000/docs`;
- защита от пересекающихся записей на уровне PostgreSQL.

Все timestamps в API передаются и возвращаются в UTC (ISO 8601). `dayOfWeek` использует диапазон `0..6`, где `0` — воскресенье. Время расписания задаётся минутами от начала UTC-дня: например, `540` — 09:00.

## Почему двойная запись невозможна

Проверка свободного времени в приложении нужна для понятной ошибки и интерфейса, но сама по себе подвержена race condition. Поэтому миграция создаёт PostgreSQL `EXCLUDE` constraint для специалиста и временного диапазона активной записи. Если два запроса одновременно выбирают один или пересекающиеся слоты, база атомарно сохранит только один, а второй получит HTTP `409 Conflict`.

## Запуск

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev
```

После `npm install` весь обычный локальный запуск можно выполнить одной командой:

```bash
npm run start:local
```

Она использует уже запущенные PostgreSQL и Redis из настроек `.env`, применяет
миграции через `prisma migrate deploy` и запускает API в watch-режиме. Prisma Client
автоматически генерируется после `npm install`; после ручного изменения
`schema.prisma` его можно обновить командой `npm run prisma:generate` при остановленном
приложении. Первичное создание администратора остаётся отдельной командой
`npm run prisma:seed`.

Для Windows PowerShell вместо `cp`:

```powershell
Copy-Item .env.example .env
```

Параметры PostgreSQL разделены в `.env`: `POSTGRES_HOST`, `POSTGRES_PORT`,
`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` и `POSTGRES_SCHEMA`.
Приложение и Prisma собирают строку подключения автоматически. При необходимости
можно задать готовый `DATABASE_URL` — он имеет приоритет над отдельными параметрами.

Redis настраивается через `REDIS_HOST` и `REDIS_PORT`; готовый `REDIS_URL` также
можно передать как override. В Redis хранятся серверные сессии, а браузер получает
только `httpOnly` cookie со случайным идентификатором сессии.

Compose-файл также читает из `.env` образ PostgreSQL и внешний порт. Технические
настройки контейнера, volume и healthcheck остаются постоянными в compose-файле.
Для разных окружений можно использовать отдельные файлы без изменения
`docker-compose.yml`:

```bash
docker compose --env-file .env.local up -d
docker compose --env-file .env.production up -d
```

Если backend запускается на хосте, используется `POSTGRES_HOST=localhost`. Если он
будет добавлен в тот же Docker Compose, следует указать `POSTGRES_HOST=postgres` —
это имя сервиса внутри Docker-сети.

Проверки:

```bash
npm test
npm run test:e2e
npm run lint
npm run build
```

`test:e2e` использует `DATABASE_URL` и проверяет реальную конкурентную вставку в PostgreSQL. Тест создаёт данные с уникальными идентификаторами и удаляет только их.

## Основной сценарий API

1. Войти администратором через `POST /api/auth/login` (данные из `ADMIN_EMAIL` и `ADMIN_PASSWORD`).
2. Создать услугу через `POST /api/services`.
3. Создать специалиста через `POST /api/specialists`, передав `serviceIds`.
4. Установить расписание через `PUT /api/specialists/:id/schedule`.
5. Зарегистрировать клиента через `POST /api/auth/register`.
6. Получить слоты через `GET /api/availability?specialistId=...&serviceId=...&date=2030-01-02`.
7. Создать запись через `POST /api/bookings`.

После регистрации или входа backend устанавливает `httpOnly` cookie с идентификатором
сессии. Закрытые endpoint'ы используют эту cookie; frontend должен отправлять запросы
с `credentials: 'include'`. `POST /api/auth/logout` удаляет сессию из Redis и очищает cookie.

## Структура

```text
src/
  core/prisma/            # инфраструктура базы данных
  modules/
    auth/                 # регистрация, вход, текущий пользователь
    services/             # услуги
    specialists/          # специалисты и расписание
    availability/         # расчёт свободных слотов
    bookings/             # записи и календарь
  shared/                 # guards, decorators, types, time helpers
prisma/
  schema.prisma
  migrations/             # включая constraint от пересечений
  seed.ts                 # создание администратора
```

Архитектура намеренно остаётся монолитной: один API и одна база. Очереди, Redis, микросервисы и отдельный слой абстрактных repository не нужны для текущего размера и только скрыли бы бизнес-логику.
