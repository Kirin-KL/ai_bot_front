# Панель управления голосовым ботом

React + Vite + TypeScript + Tailwind CSS + React Router + Axios + Zustand.

## Запуск

```bash
npm install
npm run dev
```

Фронтенд: http://localhost:5173  
API проксируется на `http://127.0.0.1:8000` через префикс `/api` (см. `vite.config.ts`).

## Переменные окружения

Скопируйте `.env.example` в `.env`:

```
VITE_API_BASE_URL=/api
```

Для прямого обращения к API без прокси:

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Роли

- `admin` — все разделы
- `system_manager` — без «Пользователи», «Права доступа», «История действий»

## Сборка

```bash
npm run build
```
