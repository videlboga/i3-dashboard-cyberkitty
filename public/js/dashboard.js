/**
 * 🚀 CYBERKITTY DASHBOARD MAIN
 * Основной модуль дашборда
 */

class CyberkittyDashboard {
    constructor() {
        this.components = {};
        this.refreshInterval = 30000; // 30 секунд
        this.intervalId = null;
        
        this.init();
    }
    
    async init() {
        console.log('🚀 Инициализация Cyberkitty Dashboard...');
        
        // Запрашиваем разрешения
        await this.requestPermissions();
        
        // Инициализируем компоненты
        this.initializeComponents();
        
        // Запускаем автообновление
        this.startAutoRefresh();
        
        // Добавляем обработчики событий
        this.bindGlobalEvents();
        
        // Показываем стартовую анимацию
        this.showStartupAnimation();
        
        console.log('✅ Dashboard готов к работе!');
    }
    
    async requestPermissions() {
        // Запрашиваем разрешение на уведомления
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            console.log(`🔔 Разрешение на уведомления: ${permission}`);
        }
        
        // Можно добавить другие разрешения
    }
    
    initializeComponents() {
        // Инициализируем помодоро таймер
        if (typeof PomodoroTimer !== 'undefined') {
            this.components.pomodoro = new PomodoroTimer();
            console.log('🍅 Помодоро таймер инициализирован');
        }
        
        // Инициализируем календарь (когда будет создан)
        if (typeof CalendarWidget !== 'undefined') {
            this.components.calendar = new CalendarWidget();
            console.log('📅 Календарь инициализирован');
        }
        
        // Инициализируем системный виджет
        if (typeof SystemWidget !== 'undefined') {
            this.components.system = new SystemWidget();
            this.components.system.init();
            console.log('🖥️ Системный виджет инициализирован');
        }

        // Инициализируем мониторинг процессов
        if (typeof MonitorWidget !== 'undefined') {
            this.components.monitor = new MonitorWidget();
            this.components.monitor.init();
            console.log('⚙️ Мониторинг процессов инициализирован');
        }
        
        // Инициализируем обновление времени
        this.initializeTimeUpdate();
        
        // Инициализируем системную информацию
        this.initializeSystemInfo();
    }
    
    initializeTimeUpdate() {
        const updateTime = () => {
            const timeElement = document.getElementById('current-time');
            if (timeElement) {
                const now = new Date();
                const timeString = now.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                const dateString = now.toLocaleDateString('ru-RU', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                });
                
                timeElement.textContent = `⏰ ${timeString} | ${dateString}`;
            }
        };
        
        // Обновляем каждую секунду
        updateTime();
        setInterval(updateTime, 1000);
    }
    
    async initializeSystemInfo() {
        const updateSystemInfo = async () => {
            const systemElement = document.getElementById('system-info');
            if (systemElement) {
                try {
                    // Получаем базовую системную информацию
                    const info = await this.getSystemInfo();
                    systemElement.textContent = `💻 CPU: ${info.cpu}% | RAM: ${info.memory}%`;
                } catch (error) {
                    systemElement.textContent = '💻 Система: OK';
                }
            }
        };
        
        updateSystemInfo();
        // Обновляем каждые 5 секунд
        setInterval(updateSystemInfo, 5000);
    }
    
    async getSystemInfo() {
        // Базовая системная информация (в реальном приложении через API)
        try {
            const response = await fetch('/api/system-info');
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('API недоступен, используем заглушку');
        }
        
        // Заглушка с рандомными данными для демонстрации
        return {
            cpu: Math.floor(Math.random() * 30) + 10,
            memory: Math.floor(Math.random() * 40) + 20
        };
    }
    
    startAutoRefresh() {
        this.intervalId = setInterval(() => {
            this.refreshData();
        }, this.refreshInterval);
    }
    
    async refreshData() {
        console.log('🔄 Обновление данных дашборда...');
        
        // Обновляем календарь
        if (this.components.calendar && typeof this.components.calendar.refresh === 'function') {
            await this.components.calendar.refresh();
        }
        
        // Обновляем мониторинг
        if (this.components.monitor && typeof this.components.monitor.refresh === 'function') {
            await this.components.monitor.refresh();
        }
        
        console.log('✅ Данные обновлены');
    }
    
    bindGlobalEvents() {
        // Горячие клавиши для всего дашборда
        document.addEventListener('keydown', (e) => {
            // Если фокус на поле ввода, игнорируем
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch(e.key) {
                case 'F5':
                    e.preventDefault();
                    this.refreshData();
                    break;
                case 'F11':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
                case '?':
                    this.showKeyboardShortcuts();
                    break;
            }
        });
        
        // Обработка visibility change для паузы/возобновления
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('🌙 Dashboard скрыт');
                // Можно приостановить некоторые обновления
            } else {
                console.log('🌅 Dashboard снова видим');
                // Возобновляем обновления
                this.refreshData();
            }
        });
        
        // Обработка ошибок
        window.addEventListener('error', (e) => {
            console.error('❌ Ошибка в дашборде:', e.error);
            this.showErrorNotification('Произошла ошибка в дашборде');
        });
        
        // Обработка unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            console.error('❌ Необработанная ошибка Promise:', e.reason);
            this.showErrorNotification('Ошибка сетевого запроса');
        });
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
    
    showKeyboardShortcuts() {
        const shortcuts = [
            '🍅 Пробел - Старт/Пауза помодоро',
            '🍅 R - Сброс помодоро',
            '🔄 F5 - Обновить данные',
            '🖥️ F11 - Полный экран',
            '❓ ? - Показать горячие клавиши'
        ];
        
        alert('⌨️ Горячие клавиши:\n\n' + shortcuts.join('\n'));
    }
    
    showErrorNotification(message) {
        // Показываем уведомление об ошибке
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <span class="error-message">${message}</span>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Добавляем стили если их нет
        if (!document.getElementById('error-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'error-notification-styles';
            style.textContent = `
                .error-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--cyberkitty-red);
                    color: var(--cyberkitty-bg);
                    padding: var(--padding-normal);
                    border-radius: var(--border-radius);
                    box-shadow: var(--shadow-large);
                    z-index: 9999;
                    animation: slideIn var(--transition-fast) ease-out;
                }
                .error-content {
                    display: flex;
                    align-items: center;
                    gap: var(--margin-normal);
                }
                .error-close {
                    background: none;
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    font-size: 18px;
                    padding: 0;
                    margin-left: auto;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Автоматически удаляем через 5 секунд
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 5000);
    }
    
    showStartupAnimation() {
        // Добавляем анимацию появления всех виджетов
        const widgets = document.querySelectorAll('.widget');
        widgets.forEach((widget, index) => {
            widget.style.opacity = '0';
            widget.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                widget.style.transition = 'all 0.5s ease-out';
                widget.style.opacity = '1';
                widget.style.transform = 'translateY(0)';
            }, index * 200);
        });
        
        // Показываем приветственное сообщение
        setTimeout(() => {
            this.showWelcomeMessage();
        }, 1000);
    }
    
    showWelcomeMessage() {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🚀 Cyberkitty Dashboard', {
                body: 'Добро пожаловать! Дашборд готов к работе.',
                icon: '🚀'
            });
        }
    }
    
    // Методы для API интеграции
    async callAPI(endpoint, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(endpoint, finalOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }
    
    // Утилиты
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (days > 0) {
            return `${days}д ${hours}ч ${minutes}м`;
        } else if (hours > 0) {
            return `${hours}ч ${minutes}м`;
        } else {
            return `${minutes}м`;
        }
    }
    
    // Методы для cleanup
    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        // Очищаем компоненты
        Object.values(this.components).forEach(component => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
        });
        
        console.log('🛑 Dashboard остановлен');
    }
}

// Инициализация дашборда когда DOM готов
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 DOM загружен, запускаем Cyberkitty Dashboard...');
    window.dashboard = new CyberkittyDashboard();
});

// Graceful shutdown
window.addEventListener('beforeunload', () => {
    if (window.dashboard) {
        window.dashboard.destroy();
    }
}); 