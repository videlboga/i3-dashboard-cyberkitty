/**
 * 📅 Календарь виджет - CyberKitty Dashboard
 * Интеграция с Google Calendar API (обновленная версия)
 */
class CalendarWidget {
    constructor() {
        this.events = [];
        this.gapi = null;
        this.apiKey = null;
        this.clientId = null;
        this.accessToken = null;
        this.isSignedIn = false;
        this.isLoading = false;
        this.tokenClient = null;
        this.selectedDate = new Date(); // Текущая выбранная дата
        this.currentMonth = new Date(); // Текущий месяц для отображения
        this.viewMode = 'month'; // 'month' или 'events'
        this.init();
    }

    async init() {
        try {
            console.log('📅 Календарь виджет загружен');
            this.loadConfig();
        } catch (error) {
            console.error('❌ Ошибка инициализации календаря:', error);
            this.renderOfflineMode();
        }
    }

    async loadConfig() {
        try {
            const response = await fetch('/calendar_config.json');
            const config = await response.json();
            this.apiKey = config.apiKey;
            this.clientId = config.clientId;
            
            console.log('📅 Конфигурация календаря загружена');
            
            // Ждем пока загрузятся Google API скрипты
            this.waitForGoogleAPI();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки конфигурации:', error);
            this.renderOfflineMode();
        }
    }

    waitForGoogleAPI() {
        // Проверяем каждые 100ms, готовы ли Google API
        const checkAPI = () => {
            if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
                console.log('📅 Google API готов');
                this.loadGoogleAPI();
            } else {
                // Ждем еще 100ms
                setTimeout(checkAPI, 100);
            }
        };
        checkAPI();
    }

    async loadGoogleAPI() {
        try {
            console.log('📅 Инициализируем Google API');
            
            // Инициализируем GAPI
            await new Promise((resolve) => {
                gapi.load('client', resolve);
            });
            
            await gapi.client.init({
                apiKey: this.apiKey,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
            });
            
            console.log('📅 Google Calendar API клиент инициализирован');
            
            // Инициализируем Google Identity Services
            this.initializeGIS();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки Google API:', error);
            this.renderOfflineMode();
        }
    }

    waitForGoogleIdentity() {
        // Проверяем доступность google.accounts
        if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
            this.initializeGIS();
        } else {
            // Ждем 100мс и повторяем попытку
            setTimeout(() => this.waitForGoogleIdentity(), 100);
        }
    }

    initializeGIS() {
        try {
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.clientId,
                scope: 'https://www.googleapis.com/auth/calendar.readonly',
                callback: (response) => {
                    if (response.error) {
                        console.error('❌ Ошибка авторизации:', response.error);
                        this.renderCalendar();
                        return;
                    }
                    
                    console.log('✅ Авторизация успешна');
                    this.accessToken = response.access_token;
                    this.isSignedIn = true;
                    this.loadEvents();
                }
            });
            
            console.log('📅 Google Identity Services инициализирован');
            this.renderCalendar();
            this.startAutoRefresh();
            
        } catch (error) {
            console.error('❌ Ошибка инициализации GIS:', error);
            this.renderOfflineMode();
        }
    }

    async signIn() {
        if (!this.tokenClient) {
            this.showError('Сервис авторизации не инициализирован');
            return;
        }
        
        try {
            this.isLoading = true;
            this.renderCalendar();
            
            // Запрашиваем токен
            this.tokenClient.requestAccessToken();
            
            console.log('📅 Запрос авторизации отправлен');
        } catch (error) {
            console.error('❌ Ошибка авторизации:', error);
            this.showError('Ошибка авторизации. Попробуйте ещё раз.');
            this.isLoading = false;
            this.renderCalendar();
        }
    }

    async signOut() {
        if (this.accessToken) {
            // Отзываем токен
            google.accounts.oauth2.revoke(this.accessToken, () => {
                console.log('📅 Токен отозван');
            });
        }
        
        this.accessToken = null;
        this.isSignedIn = false;
        this.events = [];
        this.renderCalendar();
        console.log('📅 Выход из Google Calendar выполнен');
    }

    async loadEvents() {
        if (!this.isSignedIn || !this.accessToken) return;

        try {
            this.isLoading = true;
            this.renderCalendar();

            // Устанавливаем токен доступа
            gapi.client.setToken({
                access_token: this.accessToken
            });

            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

            const response = await gapi.client.calendar.events.list({
                calendarId: 'primary',
                timeMin: startOfDay.toISOString(),
                timeMax: endOfDay.toISOString(),
                singleEvents: true,
                orderBy: 'startTime',
                maxResults: 10
            });

            this.events = response.result.items || [];
            console.log(`📅 Загружено событий: ${this.events.length}`);
            
        } catch (error) {
            console.error('❌ Ошибка загрузки событий:', error);
            if (error.status === 401) {
                // Токен истек, нужна повторная авторизация
                this.signOut();
                this.showError('Требуется повторная авторизация');
            } else {
                this.showError('Не удалось загрузить события календаря');
            }
        } finally {
            this.isLoading = false;
            this.renderCalendar();
        }
    }

    renderCalendar() {
        const calendarContent = document.getElementById('calendar-content');
        if (!calendarContent) return;

        if (!this.apiKey || !this.clientId) {
            this.renderOfflineMode();
            return;
        }

        if (this.isLoading) {
            calendarContent.innerHTML = `
                <div class="calendar-loading">
                    <div class="loading-spinner">⏳</div>
                    <p>Загружаем календарь...</p>
                </div>
            `;
            return;
        }

        if (!this.isSignedIn) {
            calendarContent.innerHTML = `
                <div class="calendar-auth">
                    <div class="auth-icon">📅</div>
                    <h3>Google Calendar</h3>
                    <p>Подключите свой календарь для отображения событий на сегодня</p>
                    <button class="btn btn-primary" onclick="window.calendar.signIn()">
                        🔑 Войти в Google
                    </button>
                    <div class="auth-info">
                        <small>Требуется разрешение на чтение календаря</small>
                    </div>
                </div>
            `;
            return;
        }

        // Выбираем режим отображения
        if (this.viewMode === 'month') {
            this.renderMonthView();
        } else {
            this.renderEventsView();
        }
    }

    renderMonthView() {
        const calendarContent = document.getElementById('calendar-content');
        const monthGrid = this.generateMonthGrid();
        
        calendarContent.innerHTML = `
            <div class="calendar-header">
                <div class="calendar-nav">
                    <button class="btn btn-small" onclick="window.calendar.previousMonth()" title="Предыдущий месяц">‹</button>
                    <h3 class="month-title">${this.getMonthName()}</h3>
                    <button class="btn btn-small" onclick="window.calendar.nextMonth()" title="Следующий месяц">›</button>
                </div>
                <div class="calendar-controls">
                    <button class="btn btn-small" onclick="window.calendar.toggleView()" title="Список событий">📋</button>
                    <button class="btn btn-small" onclick="window.calendar.refresh()" title="Обновить">🔄</button>
                    <button class="btn btn-small" onclick="window.calendar.signOut()" title="Выйти">🚪</button>
                </div>
            </div>
            <div class="calendar-grid">
                ${monthGrid}
            </div>
            <div class="selected-date-events">
                <h4>📅 ${this.formatSelectedDate()}</h4>
                <div id="date-events"></div>
            </div>
        `;
        
        // Загружаем события для выбранной даты
        this.loadEventsForDate(this.selectedDate);
    }

    generateMonthGrid() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        
        // Первый день месяца и сколько дней в месяце
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // День недели первого дня (0 = воскресенье, нужно преобразовать в понедельник = 0)
        let startDay = firstDay.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1; // Понедельник = 0
        
        let html = `
            <div class="calendar-weekdays">
                <div class="weekday">Пн</div>
                <div class="weekday">Вт</div>
                <div class="weekday">Ср</div>
                <div class="weekday">Чт</div>
                <div class="weekday">Пт</div>
                <div class="weekday">Сб</div>
                <div class="weekday">Вс</div>
            </div>
            <div class="calendar-days">
        `;
        
        // Пустые ячейки в начале
        for (let i = 0; i < startDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        
        // Дни месяца
        const today = new Date();
        const selectedDay = this.selectedDate.getDate();
        const selectedMonth = this.selectedDate.getMonth();
        const selectedYear = this.selectedDate.getFullYear();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(year, month, day);
            const isToday = dayDate.toDateString() === today.toDateString();
            const isSelected = day === selectedDay && month === selectedMonth && year === selectedYear;
            
            let dayClass = 'calendar-day';
            if (isToday) dayClass += ' today';
            if (isSelected) dayClass += ' selected';
            
            html += `
                <div class="${dayClass}" onclick="window.calendar.selectDate(${year}, ${month}, ${day})">
                    <span class="day-number">${day}</span>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }

    renderEvent(event) {
        const startTime = this.formatEventTime(event);
        const title = event.summary || 'Без названия';
        const location = event.location ? `📍 ${event.location}` : '';
        const description = event.description ? event.description.substring(0, 100) + '...' : '';
        
        return `
            <div class="calendar-event">
                <div class="event-header">
                    <div class="event-time">${startTime}</div>
                    <div class="event-title">${title}</div>
                </div>
                ${location ? `<div class="event-location">${location}</div>` : ''}
                ${description ? `<div class="event-description">${description}</div>` : ''}
            </div>
        `;
    }

    renderOfflineMode() {
        const calendarContent = document.getElementById('calendar-content');
        calendarContent.innerHTML = `
            <div class="calendar-offline">
                <div class="offline-icon">📅</div>
                <h3>Календарь</h3>
                <p>Для отображения событий необходимо настроить Google Calendar API</p>
                <div class="auth-info">
                    <small>Проверьте файл calendar_config.json</small>
                </div>
            </div>
        `;
    }

    showError(message) {
        const calendarContent = document.getElementById('calendar-content');
        if (!calendarContent) return;

        calendarContent.innerHTML = `
            <div class="calendar-error">
                <div class="error-icon">❌</div>
                <h3>Ошибка</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="window.calendar.renderCalendar()">
                    🔄 Попробовать снова
                </button>
            </div>
        `;
    }

    formatEventTime(event) {
        if (!event.start) return '';
        
        if (event.start.dateTime) {
            const start = new Date(event.start.dateTime);
            return start.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
        } else {
            return 'Весь день';
        }
    }

    // Методы для управления календарем
    getMonthName() {
        const monthNames = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        return `${monthNames[this.currentMonth.getMonth()]} ${this.currentMonth.getFullYear()}`;
    }

    formatSelectedDate() {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return this.selectedDate.toLocaleDateString('ru-RU', options);
    }

    selectDate(year, month, day) {
        this.selectedDate = new Date(year, month, day);
        this.renderCalendar();
    }

    previousMonth() {
        this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
        this.renderCalendar();
    }

    toggleView() {
        this.viewMode = this.viewMode === 'month' ? 'events' : 'month';
        this.renderCalendar();
    }

    renderEventsView() {
        const calendarContent = document.getElementById('calendar-content');
        
        // Отображаем события
        if (this.events.length === 0) {
            calendarContent.innerHTML = `
                <div class="calendar-header">
                    <h3>📅 Сегодня</h3>
                    <div class="calendar-controls">
                        <button class="btn btn-small" onclick="window.calendar.toggleView()" title="Календарь">🗓️</button>
                        <button class="btn btn-small" onclick="window.calendar.refresh()" title="Обновить">🔄</button>
                        <button class="btn btn-small" onclick="window.calendar.signOut()" title="Выйти">🚪</button>
                    </div>
                </div>
                <div class="calendar-empty">
                    <div class="empty-icon">🎉</div>
                    <p>Событий нет</p>
                    <small>Отличный день для отдыха!</small>
                </div>
            `;
        } else {
            const eventsList = this.events.map(event => this.renderEvent(event)).join('');
            calendarContent.innerHTML = `
                <div class="calendar-header">
                    <h3>📅 Сегодня (${this.events.length})</h3>
                    <div class="calendar-controls">
                        <button class="btn btn-small" onclick="window.calendar.toggleView()" title="Календарь">🗓️</button>
                        <button class="btn btn-small" onclick="window.calendar.refresh()" title="Обновить">🔄</button>
                        <button class="btn btn-small" onclick="window.calendar.signOut()" title="Выйти">🚪</button>
                    </div>
                </div>
                <div class="calendar-events">
                    ${eventsList}
                </div>
            `;
        }
    }

    loadEventsForDate(date) {
        if (!this.isSignedIn) return;
        
        const container = document.getElementById('date-events');
        if (!container) return;
        
        // Фильтруем события для выбранной даты
        const dateStr = date.toISOString().split('T')[0];
        const dayEvents = this.events.filter(event => {
            if (event.start && event.start.date) {
                return event.start.date === dateStr;
            }
            if (event.start && event.start.dateTime) {
                const eventDate = new Date(event.start.dateTime).toISOString().split('T')[0];
                return eventDate === dateStr;
            }
            return false;
        });
        
        if (dayEvents.length === 0) {
            container.innerHTML = `
                <div class="no-events">
                    <p>📋 Событий нет</p>
                </div>
            `;
        } else {
            const eventsList = dayEvents.map(event => this.renderCompactEvent(event)).join('');
            container.innerHTML = `
                <div class="day-events-list">
                    ${eventsList}
                </div>
            `;
        }
    }

    renderCompactEvent(event) {
        const time = this.formatEventTime(event);
        const title = event.summary || 'Без названия';
        
        return `
            <div class="compact-event">
                <div class="event-time">${time}</div>
                <div class="event-title">${title}</div>
            </div>
        `;
    }

    startAutoRefresh() {
        // Обновляем каждые 5 минут
        setInterval(() => {
            if (this.isSignedIn && !this.isLoading) {
                console.log('📅 Автообновление календаря');
                this.loadEvents();
            }
        }, 5 * 60 * 1000);
    }

    async refresh() {
        if (this.isSignedIn) {
            console.log('📅 Ручное обновление календаря');
            await this.loadEvents();
        }
    }

    destroy() {
        // Очистка ресурсов
        if (this.accessToken) {
            this.signOut();
        }
        
        // Удаляем глобальную ссылку
        if (window.calendar === this) {
            delete window.calendar;
        }
    }
}

// Инициализируем календарь при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window !== 'undefined' && !window.calendar) {
        window.calendar = new CalendarWidget();
    }
});

// Экспортируем для совместимости
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalendarWidget;
}