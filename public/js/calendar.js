/**
 * 📅 Календарь виджет - CyberKitty Dashboard
 * Простая заглушка для календаря
 */
class CalendarWidget {
    constructor() {
        this.events = [];
        this.init();
    }

    init() {
        console.log('📅 Календарь виджет загружен');
        this.renderPlaceholder();
    }

    renderPlaceholder() {
        const calendarContent = document.getElementById('calendar-content');
        if (!calendarContent) return;

        calendarContent.innerHTML = `
            <div class="calendar-placeholder">
                <div class="placeholder-icon">📅</div>
                <p>Календарь временно отключен</p>
                <small>Ожидает интеграции с вашим календарем</small>
            </div>
        `;
    }
}

// Инициализация календаря
document.addEventListener('DOMContentLoaded', () => {
    window.calendar = new CalendarWidget();
});

console.log('📅 Calendar widget загружен'); 