#!/bin/bash

"""
🛑 CYBERKITTY DASHBOARD STOPPER
Скрипт для остановки дашборда
"""

DASHBOARD_DIR="$HOME/i3-dashboard-cyberkitty"
BROWSER_CLASS="cyberkitty-dashboard"

log() {
    echo "🛑 [$(date '+%H:%M:%S')] $1"
}

log "Останавливаем Cyberkitty Dashboard..."

cd "$DASHBOARD_DIR"

# Останавливаем браузер
if pgrep -f "$BROWSER_CLASS" > /dev/null; then
    log "📱 Закрываем браузер..."
    pkill -f "$BROWSER_CLASS"
fi

# Останавливаем сервер
if pgrep -f "python3.*server.py" > /dev/null; then
    log "🔥 Останавливаем сервер..."
    pkill -f "python3.*server.py"
fi

# Удаляем PID файлы
rm -f .server.pid .browser.pid

log "✅ Cyberkitty Dashboard остановлен" 