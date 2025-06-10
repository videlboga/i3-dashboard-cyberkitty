#!/bin/bash
# 🚀 CYBERKITTY DASHBOARD LAUNCHER
# Запуск прозрачного дашборда на отдельном воркспейсе

# Настройки
DASHBOARD_URL="http://localhost:8082"
WORKSPACE="9"  # Воркспейс для дашборда
WINDOW_CLASS="cyberkitty-dashboard"

# Цвета для логов
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Запуск Cyberkitty Dashboard...${NC}"

# Проверяем, запущен ли сервер
if ! curl -s "$DASHBOARD_URL" > /dev/null; then
    echo -e "${YELLOW}⚠️  Сервер не запущен, запускаем...${NC}"
    cd "$(dirname "$0")"
    python3 server.py &
    SERVER_PID=$!
    echo -e "${GREEN}📡 Сервер запущен (PID: $SERVER_PID)${NC}"
    
    # Ждем запуска сервера
    sleep 3
fi

# Переключаемся на нужный воркспейс
echo -e "${BLUE}🖥️  Переключение на воркспейс $WORKSPACE...${NC}"
i3-msg "workspace $WORKSPACE"

# Опции браузера для прозрачности
BROWSER_OPTS=(
    --app="$DASHBOARD_URL"
    --disable-web-security
    --disable-features=VizDisplayCompositor
    --enable-transparent-visuals
    --enable-gpu
    --disable-background-timer-throttling
    --disable-backgrounding-occluded-windows
    --disable-renderer-backgrounding
    --class="$WINDOW_CLASS"
    --user-data-dir="/tmp/cyberkitty-dashboard-profile"
    --no-default-browser-check
    --no-first-run
    --disable-default-apps
    --disable-popup-blocking
    --disable-translate
    --disable-background-networking
)

# Запуск браузера (пробуем разные варианты)
if command -v chromium &> /dev/null; then
    echo -e "${GREEN}🌐 Запуск в Chromium...${NC}"
    chromium "${BROWSER_OPTS[@]}" &
    BROWSER_PID=$!
elif command -v google-chrome &> /dev/null; then
    echo -e "${GREEN}🌐 Запуск в Chrome...${NC}"
    google-chrome "${BROWSER_OPTS[@]}" &
    BROWSER_PID=$!
elif command -v firefox &> /dev/null; then
    echo -e "${GREEN}🌐 Запуск в Firefox...${NC}"
    # Firefox требует других опций
    firefox --new-instance --class="$WINDOW_CLASS" "$DASHBOARD_URL" &
    BROWSER_PID=$!
else
    echo -e "${RED}❌ Браузер не найден!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dashboard запущен (Browser PID: $BROWSER_PID)${NC}"

# Ждем запуска окна и настраиваем его
sleep 2

# Настраиваем окно дашборда 
echo -e "${BLUE}🎨 Настройка окна...${NC}"
i3-msg "[class=\"$WINDOW_CLASS\"] border pixel 2"

# Сохраняем PID для возможного завершения
echo $BROWSER_PID > /tmp/cyberkitty-dashboard.pid
echo $SERVER_PID > /tmp/cyberkitty-server.pid 2>/dev/null

echo -e "${GREEN}🎉 Dashboard готов к использованию!${NC}"
echo -e "${YELLOW}💡 Для остановки используйте: $0 stop${NC}"

# Функция остановки
if [[ "$1" == "stop" ]]; then
    echo -e "${BLUE}🛑 Остановка Dashboard...${NC}"
    
    if [[ -f /tmp/cyberkitty-dashboard.pid ]]; then
        BROWSER_PID=$(cat /tmp/cyberkitty-dashboard.pid)
        kill $BROWSER_PID 2>/dev/null
        rm /tmp/cyberkitty-dashboard.pid
        echo -e "${GREEN}🌐 Браузер остановлен${NC}"
    fi
    
    if [[ -f /tmp/cyberkitty-server.pid ]]; then
        SERVER_PID=$(cat /tmp/cyberkitty-server.pid)
        kill $SERVER_PID 2>/dev/null
        rm /tmp/cyberkitty-server.pid
        echo -e "${GREEN}📡 Сервер остановлен${NC}"
    fi
    
    echo -e "${GREEN}✅ Dashboard полностью остановлен${NC}"
    exit 0
fi 