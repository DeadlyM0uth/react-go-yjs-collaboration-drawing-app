# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

# Архитектура системы

## Общий обзор

Проект представляет собой клон Figma, реализованный по принципу клиент-серверной архитектуры. Система разделена на два основных слоя: фронтенд (клиентская часть) и бэкенд (серверная часть). Взаимодействие между слоями осуществляется через REST API и WebSocket для поддержки коллаборации в реальном времени.

---

## Фронтенд (frontend)

- **Технологии:** React, TypeScript, Vite
- **Структура:**
  - `src/components/` — переиспользуемые UI-компоненты
  - `src/pages/` — страницы приложения
  - `src/services/` — взаимодействие с API, WebSocket
  - `src/hooks/` — кастомные хуки
  - `src/types/` — типы TypeScript
  - `src/utils/` — вспомогательные функции
  - `src/collaboration/` — логика коллаборации в реальном времени
- **Функции:**
  - Редактирование графических объектов на холсте
  - Совместная работа нескольких пользователей (реалтайм)
  - Аутентификация и авторизация
  - Управление проектами и файлами

---

## Бэкенд (backend)

- **Технологии:** Go (Golang)
- **Структура:**
  - `api/` — обработчики HTTP-запросов (REST API)
  - `database/models/` — модели данных
  - `database/sql/` — SQL-скрипты для работы с БД
  - `middleware/` — промежуточные обработчики (например, для аутентификации)
  - `env/` — переменные окружения и конфигурация
- **Функции:**
  - Обработка запросов от клиента (CRUD для проектов, файлов, пользователей)
  - Аутентификация и авторизация (JWT)
  - Хранение данных в реляционной БД
  - Поддержка WebSocket для коллаборации

---

## Взаимодействие компонентов

1. **Аутентификация:**
   - Пользователь проходит регистрацию/логин на фронтенде
   - Фронтенд отправляет данные на бэкенд через REST API
   - Бэкенд возвращает JWT-токен, который хранится на клиенте

2. **Работа с проектами и файлами:**
   - CRUD-операции через REST API
   - Данные хранятся в базе данных на сервере

3. **Коллаборация в реальном времени:**
   - Для синхронизации действий пользователей используется WebSocket
   - Сервер ретранслирует изменения между всеми подключёнными клиентами

---

## Диаграмма архитектуры (текстовая)

```
[ Клиент (React) ] <---REST/WebSocket---> [ Сервер (Go) ] <---SQL---> [ База данных ]
```

---

## Безопасность
- Все чувствительные операции защищены JWT
- Валидация данных на сервере
- Ограничение доступа к проектам по ролям

---

## Масштабируемость
- Возможность горизонтального масштабирования backend
- Использование WebSocket для эффективной работы в реальном времени
- Разделение логики на модули для упрощения поддержки и расширения
