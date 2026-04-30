# GitLab Readme Counter

Генерация **SVG-карточек для README** на основе данных **gitlab.com** (аналог идеи «статистики в профиле», но для GitLab). Есть отдельная **интерактивная страница** `/stats` с кликабельной теплокартой и подсказками.

## Благодарность апстриму

Вдохновение и часть идей (темы, UX в духе карточек) — у проекта **[github-readme-stats](https://github.com/anuraghazra/github-readme-stats)** (лицензия MIT). Детали заимствований по лицензиям см. в [`LICENSE-THIRD-PARTY.md`](./LICENSE-THIRD-PARTY.md).

## Чем top-langs отличается от GitHub-апстрима

Здесь доли языков считаются по **публичным проектам участия пользователя на GitLab.com** (список проектов с API GitLab для пользователя), а не по выборке «только свои репозитории без форков», как в описании GRS для GitHub.

## Эндпоинты и страницы

Публичный деплой этого репозитория на Vercel: **`https://gitlab-readme-counter.vercel.app`**. В примерах ниже используется он; для своего форка замените хост на свой домен. В качестве иллюстрации везде указан ник **`gitlab-bot`** — замените на свой логин GitLab.com.

## Живые примеры карточек

Ниже те же эндпоинты, что в таблицах: изображения грузятся с деплоя как обычные картинки в README. Если превью не видно (блокировка сети или кэш), откройте URL из примеров в браузере.

**Статистика — тема default**

![GitLab stats — default](https://gitlab-readme-counter.vercel.app/api?username=gitlab-bot)

**Статистика — Tokyo Night, без рамки, с иконками**

![GitLab stats — tokyonight, icons](https://gitlab-readme-counter.vercel.app/api?username=gitlab-bot&theme=tokyonight&hide_border=true&show_icons=true)

**Топ языков — обычный layout**

![Top Langs — normal](https://gitlab-readme-counter.vercel.app/api/top-langs?username=gitlab-bot)

**Топ языков — compact, Tokyo Night**

![Top Langs — compact](https://gitlab-readme-counter.vercel.app/api/top-langs?username=gitlab-bot&layout=compact&theme=tokyonight&hide_border=true)

### `/api` — карточка статистики (SVG)

| Параметр | Обязательный | По умолчанию | Описание |
|----------|----------------|----------------|----------|
| `username` или `user` | да | — | Ник пользователя на GitLab.com |
| `theme` | нет | `default` | Тема оформления (см. [Темы](#темы)) |
| `hide_border` | нет | `false` | Скрыть рамку карточки |
| `show_icons` | нет | `false` | Показать иконки у строк статистики |
| `custom_title` | нет | — | Свой заголовок карточки (лучше передавать в URL в закодированном виде, см. примеры) |

Логические параметры (`hide_border`, `show_icons`): истина — `1`, `true`, `yes`, `y`, `on`; ложь — `0`, `false`, `no`, `n`, `off`; пустое значение или неизвестное слово — берётся значение по умолчанию.

**Примеры:**

```text
https://gitlab-readme-counter.vercel.app/api?username=gitlab-bot
https://gitlab-readme-counter.vercel.app/api?user=gitlab-bot&theme=tokyonight&hide_border=true
https://gitlab-readme-counter.vercel.app/api?username=gitlab-bot&show_icons=true
https://gitlab-readme-counter.vercel.app/api?username=gitlab-bot&custom_title=Моя%20статистика
```

Вставка в README как картинка:

```markdown
![GitLab stats](https://gitlab-readme-counter.vercel.app/api?username=gitlab-bot)
![GitLab stats](https://gitlab-readme-counter.vercel.app/api?username=gitlab-bot&theme=tokyonight&hide_border=true&show_icons=true)
```

### `/api/top-langs` — топ языков (SVG)

| Параметр | Обязательный | По умолчанию | Описание |
|----------|----------------|----------------|----------|
| `username` или `user` | да | — | Ник на GitLab.com |
| `theme` | нет | `default` | Тема |
| `hide_border` | нет | `false` | Скрыть рамку |
| `layout` | нет | `normal` | `normal` или `compact` |
| `langs_count` или `langs` | нет | `10` | Сколько языков показать (от **1** до **20**) |

**Примеры:**

```text
https://gitlab-readme-counter.vercel.app/api/top-langs?username=gitlab-bot
https://gitlab-readme-counter.vercel.app/api/top-langs?username=gitlab-bot&layout=compact&theme=tokyonight
https://gitlab-readme-counter.vercel.app/api/top-langs?username=gitlab-bot&langs_count=8&hide_border=true
https://gitlab-readme-counter.vercel.app/api/top-langs?user=gitlab-bot&langs=5
```

В README:

```markdown
![Top Langs](https://gitlab-readme-counter.vercel.app/api/top-langs?username=gitlab-bot)
![Top Langs compact](https://gitlab-readme-counter.vercel.app/api/top-langs?username=gitlab-bot&layout=compact&theme=tokyonight&hide_border=true)
```

### `/stats` — интерактивная карточка в браузере

Не SVG: HTML-страница с той же логикой данных, что у `/api`, плюс клики по дням теплокарты и по шкале «меньше — больше». Для статичной картинки в профиль используйте `/api`.

| Параметр | Обязательный | По умолчанию | Описание |
|----------|----------------|----------------|----------|
| `username` или `user` | да | — | Ник на GitLab.com |
| `theme` | нет | `default` | Тема |
| `hide_border` | нет | `false` | Скрыть рамку блока карточки |
| `custom_title` | нет | — | Свой заголовок |

Параметр `show_icons` на странице `/stats` не используется (иконки актуальны только для SVG `/api`).

**Примеры:**

```text
https://gitlab-readme-counter.vercel.app/stats?username=gitlab-bot
https://gitlab-readme-counter.vercel.app/stats?user=gitlab-bot&theme=tokyonight&hide_border=true
https://gitlab-readme-counter.vercel.app/stats?username=gitlab-bot&custom_title=GitLab%20overview
```

## Темы

Поддерживаются имена (регистр не важен):

| Имя в URL | Описание |
|-----------|----------|
| `default` | Светлая палитра по умолчанию |
| `tokyonight` | Тёмная палитра в духе Tokyo Night |

Неизвестное значение `theme` трактуется как **`default`**.

## Лимиты и надёжность

В коде заданы жёсткие пределы обхода API (см. `lib/gitlab/constants.ts`):

- `MAX_PROJECT_PAGES` — **3**
- `MAX_LANGUAGE_FETCH_PROJECTS` — **30**

Публичный GitLab API отвечает с квотами и ограничениями видимости: карточки работают **best-effort** (при ошибках или пустых данных показывается сообщение на SVG).

## Переменные окружения

| Переменная | Описание |
|------------|-----------|
| `GITLAB_TOKEN` | **Опционально** в настройках Vercel. Серверный токен: передаётся в запросах как заголовок `PRIVATE-TOKEN`, **не попадает в URL** и недоступен клиентам. Удобно при своих лимитах или доступе к тем данным API, которые требуют авторизации. |
| `STATS_DATA_REVALIDATE_SECONDS` | **Опционально.** Интервал в секундах (от **60** до **86400**), с которым сервер **повторно ходит в GitLab** для одного и того же пользователя. По умолчанию **600** (10 минут): повторные запросы `/api`, `/api/top-langs` и `/stats` берут данные из кэша Next.js и реже нагружают GitLab. |

Параметр **`count_private`** в духе github-readme-stats **пока не реализован**; без серверного токена доступны только публичные ответы API. Когда поддержка приватной статистики появится, она будет иметь смысл только совместно с `GITLAB_TOKEN` на вашем деплое (никогда не подставляйте токен в query-параметры).

## Локально

```bash
npm install
npm run dev
```

```bash
npm run build
npm test
```

После `npm run dev` примеры замените на `http://localhost:3000/...`.
