/**
 * 🍅 POMODORO TIMER MODULE
 * Помодоро таймер с интеграцией anime-lock
 */

class PomodoroTimer {
    constructor() {
        // Настройки таймера
        this.settings = {
            workDuration: 25 * 60,      // 25 минут
            shortBreak: 5 * 60,         // 5 минут
            longBreak: 15 * 60,         // 15 минут
            sessionsUntilLongBreak: 4   // После 4 сессий - длинный перерыв
        };
        
        // Состояние таймера
        this.state = {
            timeRemaining: this.settings.workDuration,
            isRunning: false,
            isPaused: false,
            currentSession: 1,
            totalSessions: 8,
            sessionType: 'work', // 'work', 'shortBreak', 'longBreak'
            intervalId: null
        };
        
        // Элементы DOM
        this.elements = {
            display: document.getElementById('timer-display'),
            progressCircle: document.getElementById('progress-circle'),
            startBtn: document.getElementById('start-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            resetBtn: document.getElementById('reset-btn'),
            sessionCount: document.getElementById('session-count'),
            sessionType: document.getElementById('session-type'),
            widget: document.getElementById('pomodoro-section')
        };
        
        // Звуки (можно добавить аудио файлы)
        this.sounds = {
            tick: null,
            break: null,
            complete: null
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateDisplay();
        this.updateSessionInfo();
        
        // Загружаем сохраненное состояние
        this.loadState();
    }
    
    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => this.start());
        this.elements.pauseBtn.addEventListener('click', () => this.pause());
        this.elements.resetBtn.addEventListener('click', () => this.reset());
        
        // Горячие клавиши
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName !== 'INPUT') {
                switch(e.key) {
                    case ' ':
                        e.preventDefault();
                        this.state.isRunning ? this.pause() : this.start();
                        break;
                    case 'r':
                        this.reset();
                        break;
                    case 'Escape':
                        this.pause();
                        break;
                }
            }
        });
    }
    
    start() {
        if (!this.state.isRunning) {
            this.state.isRunning = true;
            this.state.isPaused = false;
            
            this.elements.startBtn.textContent = 'Работает...';
            this.elements.startBtn.disabled = true;
            this.elements.pauseBtn.disabled = false;
            
            // Записываем статус для anime-lock
            this.writeStatusToFile();
            
            this.state.intervalId = setInterval(() => {
                this.tick();
            }, 1000);
            
            this.animateTimer();
            this.updateTomatoState();
        }
    }
    
    pause() {
        if (this.state.isRunning) {
            this.state.isRunning = false;
            this.state.isPaused = true;
            
            clearInterval(this.state.intervalId);
            
            this.elements.startBtn.textContent = 'Продолжить';
            this.elements.startBtn.disabled = false;
            this.elements.pauseBtn.disabled = true;
            
            // Очищаем статус
            this.clearStatusFile();
            this.updateTomatoState();
        }
    }
    
    reset() {
        this.state.isRunning = false;
        this.state.isPaused = false;
        
        clearInterval(this.state.intervalId);
        
        // Сбрасываем время в зависимости от типа сессии
        switch(this.state.sessionType) {
            case 'work':
                this.state.timeRemaining = this.settings.workDuration;
                break;
            case 'shortBreak':
                this.state.timeRemaining = this.settings.shortBreak;
                break;
            case 'longBreak':
                this.state.timeRemaining = this.settings.longBreak;
                break;
        }
        
        this.elements.startBtn.textContent = 'Старт';
        this.elements.startBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        
        this.updateDisplay();
        this.clearStatusFile();
        this.updateTomatoState();
    }
    
    tick() {
        this.state.timeRemaining--;
        
        if (this.state.timeRemaining <= 0) {
            this.completeSession();
        } else {
            this.updateDisplay();
            this.updateTomatoState(); // Обновляем состояние помидорки
            this.writeStatusToFile();
        }
    }
    
    completeSession() {
        this.state.isRunning = false;
        clearInterval(this.state.intervalId);
        
        // Показываем анимацию завершения
        this.elements.widget.classList.add('completed');
        setTimeout(() => {
            this.elements.widget.classList.remove('completed');
        }, 600);
        
        // Определяем следующий тип сессии
        if (this.state.sessionType === 'work') {
            // После работы - перерыв
            if (this.state.currentSession % this.settings.sessionsUntilLongBreak === 0) {
                this.startBreak('longBreak');
            } else {
                this.startBreak('shortBreak');
            }
            this.state.currentSession++;
        } else {
            // После перерыва - работа
            this.startWork();
        }
        
        this.updateSessionInfo();
        this.saveState();
        
        // Воспроизводим звук завершения
        this.playCompletionSound();
        
        // Показываем уведомление
        this.showNotification();
    }
    
    startWork() {
        this.state.sessionType = 'work';
        this.state.timeRemaining = this.settings.workDuration;
        this.updateDisplay();
        this.updateSessionInfo();
        this.updateTomatoState();
        
        this.elements.startBtn.textContent = 'Старт';
        this.elements.startBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
    }
    
    startBreak(breakType) {
        this.state.sessionType = breakType;
        
        if (breakType === 'longBreak') {
            this.state.timeRemaining = this.settings.longBreak;
        } else {
            this.state.timeRemaining = this.settings.shortBreak;
        }
        
        this.updateDisplay();
        this.updateSessionInfo();
        this.updateTomatoState();
        
        // Автоматически запускаем блокировку экрана
        this.startScreenLock();
        
        // Автоматически начинаем отсчет перерыва
        setTimeout(() => {
            this.start();
        }, 1000);
    }
    
    async startScreenLock() {
        try {
            // Записываем статус помодоро для anime-lock
            await this.writeStatusToFile();
            
            // Запускаем anime-lock-python напрямую
            const response = await fetch('/api/lock-screen', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionType: this.state.sessionType,
                    timeRemaining: this.state.timeRemaining,
                    lockCommand: '/home/cyberkitty/.local/bin/anime-lock-python'
                })
            });
            
            if (!response.ok) {
                console.warn('Не удалось запустить anime-lock через API, пробуем альтернативный способ');
                // Альтернативный способ через системную команду
                this.lockScreenFallback();
            }
        } catch (error) {
            console.error('Ошибка запуска блокировки:', error);
            this.lockScreenFallback();
        }
    }
    
    lockScreenFallback() {
        // Показываем уведомление вместо блокировки
        this.showFullScreenBreakMessage();
    }
    
    showFullScreenBreakMessage() {
        // Создаем полноэкранное сообщение о перерыве
        const breakOverlay = document.createElement('div');
        breakOverlay.className = 'break-overlay';
        breakOverlay.innerHTML = `
            <div class="break-message">
                <h1>☕ Время перерыва!</h1>
                <div class="break-timer">${this.formatTime(this.state.timeRemaining)}</div>
                <p>Отдохните, потянитесь, выпейте воды</p>
                <button class="btn btn-accent" onclick="this.parentElement.parentElement.remove()">
                    Понятно
                </button>
            </div>
        `;
        
        // Добавляем стили для overlay
        const style = document.createElement('style');
        style.textContent = `
            .break-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(30, 30, 46, 0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(10px);
            }
            .break-message {
                text-align: center;
                padding: 2rem;
                background: var(--cyberkitty-bg-light);
                border: 2px solid var(--cyberkitty-blue);
                border-radius: var(--border-radius-large);
                box-shadow: var(--shadow-large);
            }
            .break-message h1 {
                color: var(--cyberkitty-blue);
                font-size: 3rem;
                margin-bottom: 1rem;
            }
            .break-timer {
                font-size: 4rem;
                font-weight: 700;
                color: var(--cyberkitty-pink);
                margin: 1rem 0;
                text-shadow: 0 0 20px rgba(243, 139, 168, 0.5);
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(breakOverlay);
        
        // Обновляем таймер в overlay
        const updateBreakTimer = () => {
            const timerElement = breakOverlay.querySelector('.break-timer');
            if (timerElement && this.state.isRunning) {
                timerElement.textContent = this.formatTime(this.state.timeRemaining);
            }
        };
        
        const breakInterval = setInterval(updateBreakTimer, 1000);
        
        // Убираем overlay когда перерыв закончится
        const checkBreakEnd = () => {
            if (this.state.sessionType === 'work' || this.state.timeRemaining <= 0) {
                clearInterval(breakInterval);
                if (document.body.contains(breakOverlay)) {
                    breakOverlay.remove();
                }
            } else {
                setTimeout(checkBreakEnd, 1000);
            }
        };
        
        setTimeout(checkBreakEnd, 1000);
    }
    
    async writeStatusToFile() {
        const status = `Осталось: ${this.formatTime(this.state.timeRemaining)}`;
        
        try {
            // В реальном приложении здесь будет API вызов
            // Пока просто записываем в localStorage
            localStorage.setItem('pomodoro_status', status);
            
            // Также можно попробовать записать в файл через API
            await fetch('/api/pomodoro-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            }).catch(() => {}); // Игнорируем ошибки
            
        } catch (error) {
            console.warn('Не удалось записать статус:', error);
        }
    }
    
    clearStatusFile() {
        localStorage.removeItem('pomodoro_status');
        
        fetch('/api/pomodoro-status', {
            method: 'DELETE'
        }).catch(() => {}); // Игнорируем ошибки
    }
    
    updateDisplay() {
        const timeText = this.formatTime(this.state.timeRemaining);
        this.elements.display.textContent = timeText;
        
        // Обновляем круговой прогресс-бар
        this.updateProgressBar();
        
        // Меняем цвет в зависимости от типа сессии
        this.elements.display.className = 'timer-display';
        if (this.state.sessionType !== 'work') {
            this.elements.display.classList.add('break-mode');
        }
        
        // Добавляем пульсацию когда время заканчивается
        if (this.state.timeRemaining <= 60 && this.state.isRunning) {
            this.elements.display.classList.add('pulse');
        } else {
            this.elements.display.classList.remove('pulse');
        }
    }
    
    updateProgressBar() {
        if (!this.elements.progressCircle) return;
        
        // Определяем общее время для текущего типа сессии
        let totalTime;
        switch(this.state.sessionType) {
            case 'work':
                totalTime = this.settings.workDuration;
                break;
            case 'shortBreak':
                totalTime = this.settings.shortBreak;
                break;
            case 'longBreak':
                totalTime = this.settings.longBreak;
                break;
            default:
                totalTime = this.settings.workDuration;
        }
        
        // Вычисляем прогресс (от 0 до 1)
        const progress = (totalTime - this.state.timeRemaining) / totalTime;
        
        // Длина окружности: 2 * π * r = 2 * π * 60 ≈ 377
        const circumference = 377;
        const offset = circumference - (progress * circumference);
        
        // Обновляем stroke-dashoffset
        this.elements.progressCircle.style.strokeDashoffset = offset;
    }
    
    updateSessionInfo() {
        this.elements.sessionCount.textContent = `${this.state.currentSession}/${this.state.totalSessions}`;
        
        const typeNames = {
            'work': 'Работа',
            'shortBreak': 'Короткий перерыв',
            'longBreak': 'Длинный перерыв'
        };
        
        this.elements.sessionType.textContent = typeNames[this.state.sessionType];
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    animateTimer() {
        // Добавляем визуальные эффекты при запуске
        this.elements.display.classList.add('fade-in');
        setTimeout(() => {
            this.elements.display.classList.remove('fade-in');
        }, 300);
    }
    
    updateTomatoState() {
        // Убираем все классы состояний
        this.elements.widget.classList.remove('working', 'break', 'paused', 'urgent', 'completed');
        
        // Добавляем соответствующий класс
        if (this.state.isPaused) {
            this.elements.widget.classList.add('paused');
        } else if (this.state.isRunning) {
            if (this.state.sessionType === 'work') {
                this.elements.widget.classList.add('working');
                
                // Добавляем "urgent" если остается меньше 2 минут
                if (this.state.timeRemaining <= 120) {
                    this.elements.widget.classList.add('urgent');
                }
            } else {
                this.elements.widget.classList.add('break');
            }
        }
    }
    
    playCompletionSound() {
        // Здесь можно добавить звуковые уведомления
        // Пока просто используем системный звук
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D1vnkpBSl+zO/ZizkHGGS57OafUR8MRJze8bllHggzj9n1s24iByF4xu/gkTgIG2W99N2QQg8PUa/i2bNqIgUrkMTz0XYiByJ4ye/didC...'); // Заглушка
            audio.play().catch(() => {}); // Игнорируем ошибки
        } catch (error) {
            // Если звук не поддерживается, ничего не делаем
        }
    }
    
    showNotification() {
        if ('Notification' in window) {
            const typeNames = {
                'work': 'работы',
                'shortBreak': 'короткого перерыва',
                'longBreak': 'длинного перерыва'
            };
            
            const message = this.state.sessionType === 'work' 
                ? '🍅 Время перерыва!' 
                : '💼 Время работать!';
            
            new Notification('Cyberkitty Pomodoro', {
                body: message,
                icon: '🍅'
            });
        }
    }
    
    saveState() {
        localStorage.setItem('pomodoro_state', JSON.stringify(this.state));
    }
    
    loadState() {
        const saved = localStorage.getItem('pomodoro_state');
        if (saved) {
            try {
                const savedState = JSON.parse(saved);
                this.state = { ...this.state, ...savedState };
                this.state.isRunning = false; // Всегда начинаем в остановленном состоянии
                this.state.intervalId = null;
                this.updateDisplay();
                this.updateSessionInfo();
            } catch (error) {
                console.warn('Не удалось загрузить сохраненное состояние:', error);
            }
        }
    }
}

// Добавляем стили для режима перерыва
const breakModeStyle = document.createElement('style');
breakModeStyle.textContent = `
    .timer-display.break-mode {
        color: var(--cyberkitty-pink) !important;
        text-shadow: 0 0 20px rgba(243, 139, 168, 0.5) !important;
    }
`;
document.head.appendChild(breakModeStyle);

// Экспортируем класс для использования в других модулях
window.PomodoroTimer = PomodoroTimer; 