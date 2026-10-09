# Выпуск через GitHub Actions

Репозиторий: https://github.com/proskurnin/china2026.proskurnin.com
Сервер: 80.87.199.223; Apache; отдельный корень /var/www/china2026.proskurnin.com.

Workflow .github/workflows/deploy.yml запускается при push в main или вручную.
Сборка выполняется в GitHub: npm ci, TypeScript, статический экспорт.
Готовый архив сохраняется в артефактах Actions и передаётся по SSH.
На сервере используется блокировка, отдельный release и атомарное переключение current.
Если локальный HTTP-контроль не проходит, прежний выпуск возвращается автоматически.
Финальная проверка сверяет commit SHA через публичный HTTPS. При её сбое Actions
показывает ошибку; уже успешно активированный выпуск автоматически не откатывается.

## Разовая настройка

1. На сервере проверить DNS домена, наличие Apache, certbot Apache plugin, curl и flock.
2. Передать deploy/ на сервер и от root выполнить:
   bash deploy/bootstrap-server.sh EMAIL
   EMAIL — адрес владельца для уведомлений сертификата. Скрипт настраивает только Китай.
3. Разрешить SSH-ключ на сервере и сверить его host key с существующей доверенной записью.
4. С машины с доступом к GitHub выполнить:
   bash deploy/configure-actions.sh /absolute/path/private_key /absolute/path/known_hosts
   Файлы остаются локальными; содержимое ключей не выводится и не попадает в Git.
5. git push -u origin main
6. Проверить успешный запуск https://github.com/proskurnin/china2026.proskurnin.com/actions

Secrets: DEPLOY_SSH_KEY, DEPLOY_KNOWN_HOSTS.
Variables: DEPLOY_HOST, DEPLOY_USER, DEPLOY_PORT (по умолчанию 80.87.199.223, root, 22).
Не переносить старый ключ Google Maps Европы: его ограничения не подходят новому домену.

## Текущее состояние

Workflow и скрипты подготовлены локально. На GitHub не отправлены, secrets не настроены,
сервер не изменён: текущая среда запрещает соединения с GitHub и SSH.
В старой локальной копии Европы workflow не найден; доступ к удалённой копии заблокирован.
Описанная схема releases/current взята из её DEPLOY.md.

Вылет: 26 октября 2026. От семьи — Роман и Артур; поездка школьного класса Артура.
Даты программы не вычисляются из даты вылета до подтверждения даты прилёта в Чэнду.
