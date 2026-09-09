# Подбор — трекер объявлений

Личный трекер подбора автомобиля: объявления с Авито, Дрома, Auto.ru и от дилеров
в одном списке, со статусами, оценками, отчётами и мнениями родных.

## Стек

React + Vite + TypeScript, Tailwind CSS v4, Supabase (Postgres, Storage, Auth), Vercel.

## Запуск

```bash
npm install
cp .env.example .env.local   # подставить ключи Supabase
npm run dev
```

## Переменные окружения

| Переменная | Назначение |
| --- | --- |
| `VITE_SUPABASE_URL` | URL проекта Supabase |
| `VITE_SUPABASE_ANON_KEY` | Публичный anon-ключ |
| `VITE_SITE_ACCESS_CODE` | Необязательный общий код доступа. Пусто — экран не показывается |

Ключи `service_role` и `sb_secret_*` во фронтенде не используются и в репозиторий не попадают.

## База данных

SQL лежит в `supabase/migrations`. Для нового проекта достаточно один раз выполнить
`supabase/apply-all.sql` в SQL Editor Supabase: он создаёт таблицы `cars`, `activity_log`,
`reviews`, триггеры истории цены, RLS-политики и два Storage-бакета.

## Доступ

- Владелец входит через Supabase Auth и редактирует данные.
- Гости открывают сайт по ссылке, выбирают имя при первом заходе и оставляют отзывы.
  Имя и `reviewer_id` хранятся в localStorage браузера.
