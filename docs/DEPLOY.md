# Деплой на VPS

## ⚠️ Важно: не передавайте пароли в чатах

Для безопасности используйте SSH-ключи вместо паролей.

---

## Вариант 1: Автодеплой через GitHub Actions (рекомендуется)

Уже настроен в `.github/workflows/deploy.yml`. При пуше в `main` код автоматически деплоится на сервер.

### Необходимые настройки (один раз)

1. **Сгенерируйте SSH-ключ на VPS** (если ещё не сделано):
   ```bash
   ssh-keygen -t ed25519 -C "github-actions"
   cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
   cat ~/.ssh/id_ed25519
   ```
   Скопируйте приватный ключ (содержимое `id_ed25519`).

2. **Добавьте Secrets в GitHub** (Settings → Secrets and variables → Actions):
   | Secret | Значение |
   |--------|----------|
   | `SSH_HOST` | `5.129.192.135` |
   | `SSH_USER` | `root` |
   | `SSH_PRIVATE_KEY` | приватный ключ из шага 1 |
   | `JWT_SECRET` | ваш JWT секрет |

3. **Убедитесь, что на VPS**:
   - Установлен Node.js 20+ (`node -v`)
   - Установлен PM2 (`npm i -g pm2`)
   - Проект склонирован в `/var/www/tulpan`
   - PM2 запущен (`pm2 start ecosystem.config.js` или `pm2 start npm --name tulpan-next -- start`)

4. **Запушьте изменения** — деплой начнётся автоматически:
   ```bash
   git add .
   git commit -m "update"
   git push origin main
   ```

---

## Вариант 2: Ручной деплой через скрипт

Файл `deploy.sh` в корне проекта.

### Шаг 1: Залейте скрипт на сервер

```bash
# На вашем компьютере:
scp deploy.sh root@5.129.192.135:/tmp/
```

### Шаг 2: Запустите на VPS

```bash
ssh root@5.129.192.135
mv /tmp/deploy.sh /var/www/tulpanomsk55/
chmod +x /var/www/tulpanomsk55/deploy.sh
cd /var/www/tulpanomsk55
./deploy.sh
```

Скрипт автоматически:
- Сделает бэкап `public/uploads/`
- Стянет последний код
- Восстановит загруженные картинки
- Установит зависимости
- Соберёт проект
- Перезапустит PM2

---

## Вариант 3: Полностью ручной деплой

Если проект ещё не настроен на сервере:

```bash
# Подключитесь к VPS
ssh root@5.129.192.135

# Установите Node.js 20 (если нет)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Установите PM2
npm i -g pm2

# Склонируйте проект
mkdir -p /var/www
cd /var/www
git clone https://github.com/nsssssssd/pract.git tulpanomsk55
cd tulpanomsk55

# Создайте .env.production (или скопируйте .env.local)
cp .env.local .env.production

# Установите зависимости и соберите
npm install
npm run build

# Запустите через PM2
pm2 start npm --name "tulpanomsk55" -- start
pm2 save
pm2 startup systemd

# Настройте Nginx (если нужно)
```

---

## Проверка после деплоя

```bash
# На VPS:
pm2 status
pm2 logs tulpanomsk55

# Проверка сайта:
curl -I http://localhost:3000
```

---

## Частые проблемы

### Картинки пропали после деплоя
В `.github/workflows/deploy.yml` уже добавлено сохранение `public/uploads/`. Если используете ручной деплой — убедитесь, что папка `public/uploads/` не удаляется при `git reset --hard`.

### `EACCES: permission denied`
```bash
chmod -R 755 /var/www/tulpanomsk55/public/uploads
```

### Порт 3000 занят
```bash
pm2 delete all
pm2 start npm --name "tulpanomsk55" -- start
```
