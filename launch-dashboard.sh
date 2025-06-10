#!/bin/bash

"""
🚀 CYBERKITTY DASHBOARD LAUNCHER
Автоматический запуск дашборда на воркспейсе 5 i3wm
"""

# Настройки
DASHBOARD_DIR="$HOME/i3-dashboard-cyberkitty"
WORKSPACE=5
PORT=8082
BROWSER_CLASS="cyberkitty-dashboard"

# Логирование
log() {
    echo "🚀 [$(date '+%H:%M:%S')] $1"
}

log "Запуск Cyberkitty Dashboard..."

# Проверяем директорию
if [ ! -d "$DASHBOARD_DIR" ]; then
    log "❌ Директория $DASHBOARD_DIR не найдена!"
    exit 1
fi

cd "$DASHBOARD_DIR"

# Проверяем, не запущен ли уже сервер
if pgrep -f "python3.*server.py" > /dev/null; then
    log "⚠️  Сервер уже запущен, завершаем процесс..."
    pkill -f "python3.*server.py"
    sleep 2
fi

# Проверяем, не открыт ли уже браузер с дашбордом
if pgrep -f "$BROWSER_CLASS" > /dev/null; then
    log "⚠️  Дашборд уже открыт, закрываем..."
    pkill -f "$BROWSER_CLASS"
    sleep 1
fi

# Запускаем сервер в фоне
log "🔥 Запускаем сервер на порту $PORT..."
nohup python3 server.py > /dev/null 2>&1 &
SERVER_PID=$!

# Ждем запуска сервера
sleep 3

# Проверяем, что сервер запустился
if ! curl -s "http://localhost:$PORT" > /dev/null; then
    log "❌ Сервер не запустился!"
    exit 1
fi

log "✅ Сервер запущен (PID: $SERVER_PID)"

# Переключаемся на воркспейс 5
log "🔄 Переключаемся на воркспейс $WORKSPACE..."
i3-msg "workspace $WORKSPACE"

# Запускаем браузер с дашбордом
log "🌐 Открываем дашборд в браузере..."
chromium-browser \
    --app="http://localhost:$PORT" \
    --class="$BROWSER_CLASS" \
    --window-size=1920,1080 \
    --no-default-browser-check \
    --no-first-run \
    --disable-infobars \
    --disable-features=TranslateUI \
    --disable-extensions \
    --disable-plugins \
    --disable-web-security \
    --user-data-dir="$HOME/.config/cyberkitty-dashboard" \
    > /dev/null 2>&1 &

BROWSER_PID=$!

# Ждем появления окна
sleep 2

# Настраиваем окно браузера через i3
log "⚙️  Настраиваем окно дашборда..."

# Убираем заголовок окна
i3-msg "[class=\"$BROWSER_CLASS\"] border pixel 0"

# Делаем окно плавающим и перемещаем в нужную позицию
i3-msg "[class=\"$BROWSER_CLASS\"] floating enable"
i3-msg "[class=\"$BROWSER_CLASS\"] resize set 1900 1060"
i3-msg "[class=\"$BROWSER_CLASS\"] move position center"

# Переводим обратно в tiling mode на воркспейсе 5
i3-msg "[class=\"$BROWSER_CLASS\"] floating disable"

# Назначаем окно на воркспейс 5
i3-msg "[class=\"$BROWSER_CLASS\"] move to workspace $WORKSPACE"

log "🎉 Cyberkitty Dashboard запущен!"
log "📡 Сервер: http://localhost:$PORT (PID: $SERVER_PID)"
log "🌐 Браузер: $BROWSER_CLASS (PID: $BROWSER_PID)"
log "🖥️  Воркспейс: $WORKSPACE"

# Сохраняем PID для последующего завершения
echo "$SERVER_PID" > "$DASHBOARD_DIR/.server.pid"
echo "$BROWSER_PID" > "$DASHBOARD_DIR/.browser.pid"

log "✅ Готово! Дашборд работает на воркспейсе $WORKSPACE" 