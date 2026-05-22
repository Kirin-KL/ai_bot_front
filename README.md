# Панель управления голосовым ботом

React + Vite + TypeScript + Tailwind CSS + React Router + Axios + Zustand.

## Запуск

```bash
npm install
npm run dev
```

Фронтенд: http://localhost:5173  
API по умолчанию: `http://91.217.81.46:8001` (см. `.env`).

## Переменные окружения

Скопируйте `.env.example` в `.env`:

```
VITE_API_BASE_URL=http://91.217.81.46:8001
```

Для локального бэкенда через прокси Vite:

```
VITE_API_BASE_URL=/api
```

(цель прокси в `vite.config.ts` — `http://127.0.0.1:8000`)

## Роли

- `admin` — все разделы
- `system_manager` — без «Пользователи», «Права доступа», «История действий»

## Сборка

```bash
npm run build
```
