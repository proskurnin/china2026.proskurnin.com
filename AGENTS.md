# AGENTS.md — Китай 2026

Правила для агентов (Claude, Codex) и людей, которые работают с этим репозиторием. Читать перед любой задачей.

## Этот сайт
- **Поездка:** 26 октября — 2 ноября 2026, Чэнду (Chengdu, 成都) и Чжанцзяцзе (Zhangjiajie, 张家界). Едут Роман и Артур со школьным классом Артура. Перелёты Sichuan Airlines 3U 3888 / 3U 3887 через Шереметьево.
- **Этап:** в поездке (26.10–02.11), после — материалы поездки. Во время поездки сайт меняем только осторожно: слияние в `main` сразу выкладывает его.
- **Адрес:** https://china2026.proskurnin.com. Репозиторий публичный: в Git не должно быть ничего закрытого, кроме уже опубликованного ранее.
- **Разделы:** Маршрут, По дням, Путеводитель, Полезно (На месте, Деньги, Связь, Розетки и пауэрбанк) — всем; Подготовка (памятка «Что взять в Китай» с отметками и заметками), Бюджет, Мой план — владельцу и участникам.
- **Названия мест:** «Русское (Latin, 中文)», например «Чэнду (Chengdu, 成都)».
- **Свои файлы:** `app/tour-*.tsx` (страница в режиме программы тура), `app/page.tsx` (старый планировщик; включается, если в плане появятся дни), `data/tour.json`, `data/tour-places.json`, `data/place-guides.json` (путеводители, проверка `scripts/check-place-guides.mjs`), `lib/tour-route.ts`, `lib/transports.json`.
- **Статус рейсов:** workflow `transport-status.yml` каждые 10 минут до 4 ноября 2026 собирает `transport-status.json` и публикует его командой `publish transport-status.json` (меняется только этот файл в текущем выпуске).
- **Фото розеток** не хранятся в Git: их скачивает `npm run assets` (`scripts/fetch-assets.sh`).
- **Закрытые данные:** `prices`, `questions`, `packing`, `flightCost`, `tourPayment` из `data/tour.json` отдаёт сервис аккаунтов из своей копии. После изменения выполните `deploy/update-private-tour-from-mac.sh` (нужен root-доступ к серверу) — он обновит только `tour.json` и перезапустит `china-account`.

<!-- travel-standard:start — этот раздел одинаковый в china2026, europe2026 и turkey2027; меняйте его во всех трёх репозиториях сразу -->
## Стандарт сайтов путешествий

Сайты поездок семьи (`<поездка>.proskurnin.com`) делаются одним способом. Эталон для нового сайта — репозиторий **turkey2027.proskurnin.com** (самый чистый). Китай и Европа построены так же, но в них остался старый «планировщик» маршрута (`app/page.tsx` с импортом плана), который в новые сайты не переносим.

### Стек
- Node **22.22.2** (`.nvmrc`), npm, `package-lock.json` обязателен.
- React 19 + TypeScript, **vinext** со статическим экспортом (`next.config.ts`: `output:'export'`); результат — `dist/client`, его отдаёт Apache. Серверного рендеринга нет.
- Tailwind 4 + компоненты `components/ui` (shadcn / Base UI), иконки `lucide-react`.
- Карты: `@googlemaps/js-api-loader` + `@googlemaps/markerclusterer`, `leaflet` (из npm, не с CDN).
- Версии зависимостей одинаковые во всех сайтах; обновляем во всех трёх сразу.

### Файлы: общие и свои
Общие файлы должны быть **одинаковыми** во всех сайтах. Изменили общий файл в одном репозитории — перенесите в остальные в тот же день.

| Общие (одинаковые) | Свои у каждого сайта |
|---|---|
| `.github/workflows/deploy.yml`, `.nvmrc` | `lib/site.ts` — название, описание, шрифты |
| `server/account/app.mjs`, `core.mjs`, `owner-invite.mjs`, `start.mjs`, `app.test.mjs` | `server/account/site.mjs` — id, адрес, база, порт; `server/account/public-plan.mjs` — очистка плана поездки |
| `app/account/*` — вход и пользователи | `data/*` — данные поездки |
| `app/tour-preparation.tsx` — закрытый чек-лист | `app/page.tsx` и компоненты страниц, свой CSS-файл темы |
| `app/tour-google-map.tsx`, `app/tour-osm-map.tsx` — карта (Китай, Турция) | `lib/tour-route.ts` — точки и переходы для карты |
| `app/layout.tsx`, `lib/account-client.ts`, `components/ui/*`, верхняя часть `app/globals.css` | `package.json` → скрипты `check`, `build`, `assets` |

Классы общих компонентов — `trip-*` и `tour-*`; оформление (цвета, шрифты) задаёт свой CSS сайта.

### Разделы и доступ
Один набор вкладок, порядок одинаковый. Лишнее для поездки не показываем, а не переименовываем.

| Раздел | Что внутри | Кто видит |
|---|---|---|
| Маршрут | первый экран, карта, места, отель | все |
| По дням | программа по дням | все |
| Путеводитель | места подробно (если есть) | все |
| Полезно | что знать о стране и дороге: деньги, связь, документы, на месте | все |
| Подготовка | наш чек-лист и заметки «не забыть» | владелец и участники |
| Бюджет | цены и расходы | владелец и участники |
| Мой план / Журнал / Контент | личные правки, журнал поездки, материалы после неё | владелец и участники |

Сайт проходит этапы: подготовка → в поездке (журнал, статус рейсов) → после поездки (контент, видео).

### Авторизация
- Сервис аккаунтов `server/account` (Node 22, встроенные `http`, `crypto`, `node:sqlite`, без зависимостей). У каждого сайта **свой контейнер и своя база**.
- Роли: **владелец** (один, управляет людьми), **участник** (видит закрытые разделы), **зритель** (только публичное). Вход только по приглашению: владелец создаёт ссылку на странице `/account/`, она действует 24 часа.
- Пароль от 12 символов (scrypt), сессия 7 дней, cookie `__Host-<site.id>-session` (Secure, HttpOnly, SameSite=Lax), лимиты попыток, проверка Origin.
- API: `/api/account/*` (вход, пользователи), `/api/trip/tour` (закрытые поля `data/tour.json`), `/api/trip/storage` (личные данные пользователя: `personal`, `preferences`, `packing` и др.), `/api/trip/plan`, `/api/trip/state`.
- Первый вход владельца или восстановление пароля — на сервере: `docker exec <site>-account node /app/owner-invite.mjs <email>`.

### Карты
- Основная — **Google Maps** (Maps JavaScript API, AdvancedMarker), запасная — **OpenStreetMap** через Leaflet. Переключатель на карте, выбор запоминается; если Google не загрузилась, сайт предлагает OpenStreetMap.
- Ключ — секрет репозитория **`GOOGLE_MAPS_KEY`**; CI записывает его в `public/maps-config.json` перед сборкой. В Git ключ и `maps-config.json` не хранятся. Ключ один на все сайты; в Google Cloud Console он должен быть ограничен по HTTP referrer (домены сайтов поездок) и по API (Maps JavaScript, Routes) — новый домен добавить в ограничения.
- Map ID — переменная репозитория **`GOOGLE_MAPS_MAP_ID`**; пока её нет, используется тестовый `DEMO_MAP_ID`.
- Локально: создайте `public/maps-config.json` вида `{"key":"…"}` или работайте с OpenStreetMap.

### Данные
- `data/tour.json` — исходник поездки. Поля `prices`, `questions`, `packing`, `flightCost`, `tourPayment` закрытые: `scripts/export-public-tour.mjs` убирает их из `data/public-tour.json`, а участникам их отдаёт сервис аккаунтов из своей копии `tour.json` на сервере.
- Сгенерированные файлы (`data/public-tour.json`, `data/public-plan.json`) руками не правим — правим исходник.
- Закрытая копия `plan.json` / `tour.json` лежит у сервиса аккаунтов (`/opt/<site>-account/releases/…`); CI её **не перезаписывает**. Изменили закрытые поля — обновите копию на сервере.
- Нельзя коммитить: `public/maps-config.json`, базы `*.sqlite`, ключи, `.env`.

### CI и деплой
- Один workflow `.github/workflows/deploy.yml`. Pull request — проверки и сборка; push в `main` — ещё и деплой. **Слияние в `main` = выкладка на сайт.**
- Контракт `package.json`: `npm run assets` (необязательно, скачать внешние файлы), `npm run check` (тесты аккаунтов, TypeScript и проверки сайта), `npm run build` → `dist/client` с `index.html` и `account/index.html`.
- CI собирает архив `site/` (`dist/client` + `release.txt` = SHA) + `account/` (`server/account/*.mjs`) и отправляет по SSH пользователю `<site>-deploy@80.87.199.223`. Ключ CI может выполнить **только** `deploy <sha> <run>` или `publish <файл.json>` (forced command `travel-site-ci-entry`).
- На сервере `travel-site-deploy`: распаковка в `releases/<sha>-<run>`, перенос разрешённых файлов (например, `transport-status.json`), обновление кода сервиса аккаунтов при изменениях (с копией базы и откатом), атомарное переключение `current`, проверка `release.txt` и `/api/account/me` по HTTPS, откат при ошибке. Хранятся **10** последних выпусков.
- Секреты репозитория: `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, `GOOGLE_MAPS_KEY`; переменные (необязательно): `GOOGLE_MAPS_MAP_ID`, `DEPLOY_HOST`.
- Откат вручную (root на сервере): `travel-site-deploy <site> rollback`. Журнал: `/var/log/travel-site-deploy.log`.

### Сервер (web-80.87.199.223)
| | Европа | Китай | Турция |
|---|---|---|---|
| Сайт | `/var/www/europe2026.proskurnin.com/current` | `/var/www/china2026.proskurnin.com/current` | `/var/www/turkey2027.proskurnin.com/current` |
| Сервис аккаунтов | `europe-account`, `127.0.0.1:3220` | `china-account`, `127.0.0.1:3221` | `turkey-account`, `127.0.0.1:3222` |
| База | `/var/lib/europe-account/europe.sqlite` | `/var/lib/china-account/china.sqlite` | `/var/lib/turkey-account/turkey.sqlite` |

- Настройки сайтов — `/etc/travel-sites/<site>.conf`; Apache проксирует `/api/account/` и `/api/trip/` на порт сервиса.
- Базы аккаунтов входят в ночной бэкап всех серверов (restic).

### Новый сайт поездки
1. Создать репозиторий `<поездка>.proskurnin.com`, скопировать в него turkey2027 (без `.git`), поменять `lib/site.ts`, `server/account/site.mjs` (новый порт), `data/*`, страницы и тему.
2. DNS A → 80.87.199.223, vhost Apache и сертификат Let's Encrypt (по образцу Турции: заголовки безопасности, кеш `/_next/static/`).
3. На сервере: пользователь `<site>-deploy` (без sudo), ключ с `command="/usr/local/libexec/travel-site-ci-entry <site>",restrict`, строка в `/etc/sudoers.d/travel-sites`, `/etc/travel-sites/<site>.conf`.
4. Сервис аккаунтов: `travel-site-account-install <site> <email владельца> < bundle` (код аккаунтов + `data/plan.json` + `data/tour.json`); ссылка для владельца — в `/root/<site>-owner-invite.txt`.
5. Добавить базу в ночной бэкап; секреты в репозиторий; первый PR → слияние → проверка сайта.

### Правила работы
- Изменения — через ветку и pull request; проверки PR должны быть зелёными до слияния.
- После выкладки проверить сайт: публичные разделы, вход, закрытые разделы, телефон (390 px) без горизонтальной прокрутки.
- Тексты сайта — на русском. В подвале: «made with ♥ by Roman A. Proskurnin».
- Факты (правила, цены, расписания) — со ссылкой на источник и датой проверки; непроверенное помечаем как предварительное.
<!-- travel-standard:end -->
