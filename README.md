# Китай 2026

Поездка 26 октября — 2 ноября 2026: Чэнду (Chengdu, 成都) и Чжанцзяцзе (Zhangjiajie, 张家界). Роман и Артур со школьным классом Артура.
Сайт: https://china2026.proskurnin.com

Сайт сделан по общему стандарту сайтов путешествий (как Европа 2026 и Турция 2027): React + TypeScript (vinext), статическая сборка под Apache, общий сервис аккаунтов, карты Google Maps + OpenStreetMap, общий CI. Правила разработки и деплоя — в `AGENTS.md`.

## Разделы

| Раздел | Кто видит |
|---|---|
| Маршрут, По дням, Путеводитель, Полезно | все |
| Подготовка, Бюджет, Мой план | владелец и участники (после входа) |

## Запуск и проверка

```sh
npm ci
npm run assets  # фото розеток для «Полезно»
npm run dev
npm run check   # тесты аккаунтов и статуса рейсов, TypeScript, путеводители
npm run build   # dist/client
```

Для Google Maps локально создайте `public/maps-config.json` (`{"key":"…"}`); в CI ключ берётся из секрета `GOOGLE_MAPS_KEY`.

made with ♥ by Roman A. Proskurnin
