# 🚀 CyberKitty Dashboard

Современный системный дашборд для Linux с красивыми виджетами и анимированным помодоро таймером!

## ✨ Особенности

### 🍅 Помодоро Таймер
- **Анимированная помидорка** с круговым прогресс-баром
- Автоматическая интеграция с аниме-локером
- Различные состояния анимации (работа/перерыв/пауза/срочно)
- Цветовая индикация прогресса

### 📊 Системный Мониторинг  
- Мониторинг CPU, памяти, дисков
- Температуры сенсоров
- Список активных процессов
- Docker контейнеры

### 📅 Календарь
- **Интеграция с Google Calendar API**
- Отображение событий на сегодня
- Авторизация через OAuth 2.0
- Автоматическая синхронизация

### 🎨 Дизайн
- Cyberpunk тематика
- Плавные анимации
- Адаптивная верстка
- Прозрачность и эффекты

## 🔧 Установка

### Требования
- Python 3.6+
- Linux (тестировался на Manjaro/Arch)
- Firefox/Chromium
- Для аниме-локера: pygame

### Быстрый старт
```bash
git clone https://github.com/yourusername/cyberkitty-dashboard
cd cyberkitty-dashboard
python3 server.py
```

Откройте http://localhost:8082 в браузере

## 📅 Настройка Google Calendar

Для интеграции с Google Calendar:

1. **Настройте API ключи** (см. [GOOGLE_CALENDAR_SETUP.md](GOOGLE_CALENDAR_SETUP.md))
2. **Создайте проект** в Google Cloud Console
3. **Получите API Key и Client ID**
4. **Настройте `calendar_config.json`**:
   ```json
   {
     "apiKey": "your_api_key",
     "clientId": "your_client_id.apps.googleusercontent.com"
   }
   ```
5. **Перезапустите сервер** и авторизуйтесь

> 🔒 API ключи автоматически скрываются в логах и не попадают в git

## 🎌 Интеграция с Аниме-Локером

Дашборд автоматически запускает аниме-локер при перерывах помодоро:

1. Установите аниме-локер: `~/.local/bin/anime-lock-python`
2. При запуске перерыва автоматически вызывается блокировка экрана
3. Локер показывает обратный отсчёт времени перерыва

## 📝 API

### POST /api/lock-screen
Запуск аниме-локера
```json
{
  "sessionType": "shortBreak",
  "timeRemaining": 300,
  "lockCommand": "/path/to/anime-lock"
}
```

### POST /api/pomodoro-status
Запись статуса помодоро для локера

### GET /api/system-info
Получение системной информации

## 🎯 Помодоро Техника

- **Работа**: 25 минут (красная помидорка)
- **Короткий перерыв**: 5 минут (зелёная помидорка)
- **Длинный перерыв**: 15 минут (после 4 сессий)
- Автоматический запуск аниме-локера на перерывах

## 🎮 Горячие Клавиши

- `Пробел` - Старт/Пауза таймера
- `R` - Сброс таймера  
- `Esc` - Пауза

## 🛠️ Разработка

### Структура проекта
```
i3-dashboard-cyberkitty/
├── server.py              # HTTP сервер
├── public/                # Веб-интерфейс
│   ├── index.html         # Главная страница
│   ├── js/                # JavaScript модули
│   │   ├── pomodoro.js    # Помодоро таймер
│   │   ├── system.js      # Системный мониторинг
│   │   └── dashboard.js   # Основной контроллер
│   └── styles/            # CSS стили
│       ├── dashboard.css  # Основные стили
│       └── cyberkitty.css # Тема CyberKitty
├── scripts/               # Вспомогательные скрипты
└── README.md
```

### Добавление новых виджетов
1. Создайте HTML разметку в `index.html`
2. Добавьте стили в `styles/dashboard.css`
3. Создайте JS модуль в `js/`
4. Добавьте API endpoint в `server.py`

## 🎨 Кастомизация

### Цвета темы
Отредактируйте CSS переменные в `styles/cyberkitty.css`:
```css
:root {
    --cyberkitty-blue: #89b4fa;
    --cyberkitty-pink: #f38ba8;
    --cyberkitty-bg: #1e1e2e;
}
```

### Анимации помидорки
Настройте в `styles/dashboard.css`:
- `@keyframes bigTomatoBounce` - прыжки
- `@keyframes bigTomatoGlow` - свечение
- `@keyframes bigLeafSway` - покачивание листьев

## 🤝 Вклад

1. Fork репозитория
2. Создайте feature branch
3. Commit изменения
4. Push в branch
5. Создайте Pull Request

## 📄 Лицензия

MIT License - делайте что хотите! 🎉

## 🙏 Благодарности

- Catppuccin цветовая схема
- Anime локер система
- Pomodoro техника
- И конечно же, котикам! 🐱

---

**Автор**: CyberKitty 🚀  
**Дата**: 2025  
**Девиз**: Простота превыше всего! ✨ 