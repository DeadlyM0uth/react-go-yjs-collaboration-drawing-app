# Figma Clone Diploma Project

## Описание

Это проект — клон Figma, реализованный на **React + TypeScript + Vite** (frontend) и **Go** (backend). Приложение поддерживает совместное редактирование графических досок в реальном времени, управление проектами, аутентификацию пользователей и приглашения.

---

## Функциональность

- Регистрация и вход пользователей (JWT)
- Создание, удаление, приглашение и выход из досок
- Совместное редактирование объектов на холсте (реалтайм, Yjs + WebSocket)
- Управление слоями, свойствами объектов, видимостью
- Приглашение участников на доску, удаление участников
- Отображение курсоров и выделения других пользователей

---

## Технологии

- **Frontend:** React, TypeScript, Vite, TailwindCSS, fabric.js, Yjs, y-websocket
- **Backend:** Go, Gin, SQLx, PostgreSQL, JWT
- **Коллаборация:** Yjs + y-websocket server

---

## Запуск проекта

### 1. Backend

1. Установите PostgreSQL и создайте базу данных.
2. В `.env` укажите переменные окружения:
   ```
   DSN=postgres://user:password@localhost:5432/dbname?sslmode=disable
   SECRET=your_jwt_secret
   PORT=:8080
   ```
3. Запустите сервер:
   ```sh
   go run main.go
   ```

### 2. WebSocket сервер Yjs

```sh
npx y-websocket-server --port 1234
```

### 3. Frontend

```sh
cd frontend
npm install
npm run dev
```

---

## Структура проекта

```
backend/
  api/              // обработчики REST API
  database/         // миграции, модели, подключение к БД
  middleware/       // JWT аутентификация
  env/              // загрузка .env
frontend/
  src/
    components/     // UI-компоненты
    pages/          // страницы приложения
    hooks/          // кастомные хуки
    collaboration/  // логика Yjs/WebSocket
    ...
```

---

## Архитектура

```
[React + Yjs] <--REST/WebSocket--> [Go API] <--SQL--> [PostgreSQL]
```

---

## Лицензия

MIT

---

## Авторы

- [Ваше имя]