/**
 * 🎯 Менеджер расположения виджетов - CyberKitty Dashboard
 * Управление drag-and-drop и сохранение позиций виджетов
 */
class LayoutManager {
    constructor() {
        this.isDragMode = false;
        this.draggedElement = null;
        this.dragOffset = { x: 0, y: 0 };
        this.widgets = [];
        this.gridSize = { width: 100, height: 80 }; // Размер ячейки сетки
        this.defaultPositions = {
            'pomodoro-section': { top: 8, left: 8 },
            'system-section': { top: 8, left: 316 },
            'calendar-section': { top: 8, left: 624 },
            'processes-section': { top: 8, left: 932 },
            'docker-section': { top: 256, left: 8 },
            'ssh-section': { top: 256, left: 316 }
        };
        
        // Сохраняем ссылки на обработчики для правильного удаления
        this.boundHandlers = {
            dragStart: (e) => this.handleDragStart(e),
            dragEnd: (e) => this.handleDragEnd(e),
            mouseMove: (e) => this.handleMouseMove(e),
            mouseUp: (e) => this.handleMouseUp(e)
        };
        
        this.init();
    }

    init() {
        console.log('🎯 Инициализация менеджера расположения');
        
        // Проверяем готовность DOM
        console.log('🎯 DOM готов:', document.readyState);
        console.log('🎯 Элементов .widget:', document.querySelectorAll('.widget').length);
        
        this.setupEventListeners();
        this.loadLayout();
        this.updateWidgetsList();
        
        // Отладочная информация
        console.log('🎯 Layout Manager инициализирован');
        console.log('🎯 Найдено виджетов:', this.widgets.length);
        console.log('🎯 Виджеты:', this.widgets.map(w => w.id));
        

    }

    setupEventListeners() {
        console.log('🔧 Настройка обработчиков событий...');
        
        // Обработчики теперь в system.js, здесь только клавиши
        
        // Обработка клавиш
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDragMode) {
                this.toggleDragMode();
            }
        });
    }

    updateWidgetsList() {
        this.widgets = Array.from(document.querySelectorAll('.widget'));
        console.log(`🎯 Найдено виджетов: ${this.widgets.length}`);
    }

    toggleDragMode() {
        this.isDragMode = !this.isDragMode;
        const toggleBtn = document.getElementById('enable-drag-mode');
        
        if (this.isDragMode) {
            this.enableDragMode();
            if (toggleBtn) {
                toggleBtn.textContent = '🔒 Зафиксировать макет';
                toggleBtn.classList.add('drag-active');
            }
            console.log('🎯 Режим перетаскивания включён');
        } else {
            this.disableDragMode();
            if (toggleBtn) {
                toggleBtn.textContent = '🎯 Режим перетаскивания';
                toggleBtn.classList.remove('drag-active');
            }
            console.log('🎯 Режим перетаскивания выключен');
        }
    }

    enableDragMode() {
        console.log('🎯 Включаем режим перетаскивания...');
        this.isDragMode = true;
        this.updateWidgetsList();
        
        console.log('🎯 Обрабатываем виджеты:', this.widgets.length);
        
        this.widgets.forEach((widget, index) => {
            console.log(`🎯 Виджет ${index + 1}: ${widget.id}`);
            widget.classList.add('draggable');
            
            // Устанавливаем минимальные размеры по умолчанию для каждого типа виджета
            let defaultWidth = 380;
            let defaultHeight = 320;
            
            // Специальные размеры для определенных виджетов
            if (widget.id === 'pomodoro-section') {
                defaultWidth = 320;
                defaultHeight = 280;
            } else if (widget.id === 'system-section') {
                defaultWidth = 400;
                defaultHeight = 350;
            } else if (widget.id === 'calendar-section') {
                defaultWidth = 350;
                defaultHeight = 400;
            } else if (widget.id === 'processes-section') {
                defaultWidth = 450;
                defaultHeight = 400;
            } else if (widget.id === 'docker-section') {
                defaultWidth = 450;
                defaultHeight = 350;
            } else if (widget.id === 'ssh-section') {
                defaultWidth = 500;
                defaultHeight = 400;
            }
            
            // Получаем текущие размеры
            const computedStyle = window.getComputedStyle(widget);
            const currentWidthPx = parseInt(widget.style.width) || parseInt(computedStyle.width) || defaultWidth;
            const currentHeightPx = parseInt(widget.style.height) || parseInt(computedStyle.height) || defaultHeight;
            
            // Проверяем, что размеры не слишком маленькие
            const finalWidth = Math.max(currentWidthPx, defaultWidth);
            const finalHeight = Math.max(currentHeightPx, defaultHeight);
            
            console.log(`🎯 Размеры ${widget.id}: ${finalWidth}px x ${finalHeight}px (было: ${currentWidthPx}x${currentHeightPx})`);
            
            // Принудительно включаем resize
            widget.style.resize = 'both';
            widget.style.overflow = 'auto';
            
            // ПРИНУДИТЕЛЬНО устанавливаем размеры
            widget.style.width = finalWidth + 'px';
            widget.style.height = finalHeight + 'px';
            
            console.log(`🎯 Применены размеры ${widget.id}: ${widget.style.width} x ${widget.style.height}`);
            
            // Добавляем обработчик изменения размера
            this.setupResizeObserver(widget);
            
            // Добавляем обработчики мыши для заголовка виджета
            const header = widget.querySelector('.widget-header');
            if (header) {
                header.style.cursor = 'grab';
                header.addEventListener('mousedown', this.boundHandlers.dragStart);
            }
        });

        // Добавляем класс режима перетаскивания к grid
        const grid = document.querySelector('.dashboard-grid');
        if (grid) {
            console.log('🎯 Grid контейнер найден');
            grid.classList.add('drag-mode');
        } else {
            console.log('❌ Grid контейнер НЕ найден!');
        }
        
        console.log('🎯 Режим перетаскивания включён');
    }

    disableDragMode() {
        this.isDragMode = false;
        console.log('🎯 Выключаем режим перетаскивания...');
        
        this.widgets.forEach(widget => {
            widget.classList.remove('draggable', 'dragging');
            
            // Отключаем resize
            widget.style.resize = 'none';
            widget.style.overflow = 'visible';
            
            // Удаляем обработчики с заголовков
            const header = widget.querySelector('.widget-header');
            if (header) {
                header.style.cursor = '';
                header.removeEventListener('mousedown', this.boundHandlers.dragStart);
            }
        });

        // Очищаем ResizeObserver
        if (this.resizeObservers) {
            this.resizeObservers.forEach(observer => {
                observer.disconnect();
            });
            this.resizeObservers = [];
        }

        const grid = document.querySelector('.dashboard-grid');
        if (grid) {
            grid.classList.remove('drag-mode');
        }

        // Удаляем глобальные обработчики если были добавлены
        document.removeEventListener('mousemove', this.boundHandlers.mouseMove);
        document.removeEventListener('mouseup', this.boundHandlers.mouseUp);
        
        console.log('🎯 Режим перетаскивания выключен');
    }

    handleDragStart(e) {
        e.preventDefault();
        
        this.draggedElement = e.target.closest('.widget');
        if (!this.draggedElement) return;
        
        // Запоминаем смещение мыши относительно виджета
        const rect = this.draggedElement.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        this.draggedElement.classList.add('dragging');
        this.draggedElement.style.zIndex = '1000';
        
        // Добавляем глобальные обработчики
        document.addEventListener('mousemove', this.boundHandlers.mouseMove);
        document.addEventListener('mouseup', this.boundHandlers.mouseUp);
        
        // Меняем курсор
        document.body.style.cursor = 'grabbing';
        
        console.log(`🎯 Начато перетаскивание: ${this.draggedElement.id}`);
    }

    handleMouseMove(e) {
        if (!this.draggedElement) return;
        
        e.preventDefault();
        
        // Вычисляем новую позицию
        const gridRect = document.querySelector('.dashboard-grid').getBoundingClientRect();
        const newX = e.clientX - gridRect.left - this.dragOffset.x;
        const newY = e.clientY - gridRect.top - this.dragOffset.y;
        
        // Применяем позицию
        this.draggedElement.style.left = newX + 'px';
        this.draggedElement.style.top = newY + 'px';
    }

    handleMouseUp(e) {
        if (!this.draggedElement) return;
        
        // Привязываем к сетке
        this.snapToGrid(this.draggedElement);
        
        // Убираем классы и стили
        this.draggedElement.classList.remove('dragging');
        this.draggedElement.style.zIndex = '';
        
        // Удаляем глобальные обработчики
        document.removeEventListener('mousemove', this.boundHandlers.mouseMove);
        document.removeEventListener('mouseup', this.boundHandlers.mouseUp);
        
        // Возвращаем курсор
        document.body.style.cursor = '';
        
        console.log(`🎯 Перетаскивание завершено: ${this.draggedElement.id}`);
        
        // Сохраняем новое расположение
        this.saveLayout();
        
        this.draggedElement = null;
    }

    snapToGrid(widget) {
        const rect = widget.getBoundingClientRect();
        const gridRect = document.querySelector('.dashboard-grid').getBoundingClientRect();
        
        // Текущая позиция относительно grid
        const currentX = rect.left - gridRect.left;
        const currentY = rect.top - gridRect.top;
        
        // Привязываем к ближайшей ячейке сетки
        const snappedX = Math.round(currentX / this.gridSize.width) * this.gridSize.width + 8; // +8 для отступа
        const snappedY = Math.round(currentY / this.gridSize.height) * this.gridSize.height + 8;
        
        // Применяем новую позицию
        widget.style.left = snappedX + 'px';
        widget.style.top = snappedY + 'px';
        
        console.log(`🎯 Привязка к сетке: ${widget.id} -> (${snappedX}, ${snappedY})`);
    }

    setupResizeObserver(widget) {
        // Используем ResizeObserver для отслеживания изменения размеров
        if (window.ResizeObserver) {
            let isResizing = false; // Флаг для предотвращения циклических обновлений
            
            const resizeObserver = new ResizeObserver(entries => {
                if (isResizing) return; // Предотвращаем циклические обновления
                
                for (let entry of entries) {
                    const { width, height } = entry.contentRect;
                    
                    // Игнорируем слишком маленькие размеры
                    if (width < 50 || height < 50) {
                        console.log(`📏 Игнорируем слишком маленький размер: ${widget.id} -> ${width}x${height}`);
                        return;
                    }
                    
                    isResizing = true;
                    
                    // Применяем размеры только если они кардинально изменились
                    const currentWidth = parseInt(widget.style.width) || 0;
                    const currentHeight = parseInt(widget.style.height) || 0;
                    
                    if (Math.abs(width - currentWidth) > 10 || Math.abs(height - currentHeight) > 10) {
                        widget.style.width = width + 'px';
                        widget.style.height = height + 'px';
                        
                        console.log(`📏 Размер обновлен: ${widget.id} -> ${width}x${height}`);
                        
                        // Автосохранение при изменении размера (с дебаунсом)
                        clearTimeout(this.resizeTimeout);
                        this.resizeTimeout = setTimeout(() => {
                            this.saveLayout();
                        }, 1000);
                    }
                    
                    // Сбрасываем флаг через короткое время
                    setTimeout(() => {
                        isResizing = false;
                    }, 100);
                }
            });
            resizeObserver.observe(widget);
            
            // Сохраняем observer для очистки
            if (!this.resizeObservers) {
                this.resizeObservers = [];
            }
            this.resizeObservers.push(resizeObserver);
        }
    }



    saveLayout() {
        const layout = {};
        
        this.widgets.forEach(widget => {
            const style = window.getComputedStyle(widget);
            
            // Получаем размеры с проверкой на валидность
            const width = parseInt(widget.style.width) || parseInt(style.width) || 380;
            const height = parseInt(widget.style.height) || parseInt(style.height) || 320;
            
            // Сохраняем только если размеры разумные
            layout[widget.id] = {
                top: parseInt(widget.style.top) || parseInt(style.top) || 0,
                left: parseInt(widget.style.left) || parseInt(style.left) || 0,
                width: Math.max(width, 200),   // Минимальная ширина 200px
                height: Math.max(height, 150)  // Минимальная высота 150px
            };
        });
        
        localStorage.setItem('cyberkitty_dashboard_layout', JSON.stringify(layout));
        console.log('💾 Расположение и размеры виджетов сохранены', layout);
        
        // Показываем уведомление
        this.showNotification('Макет сохранен! 💾');
    }

    loadLayout() {
        const savedLayout = localStorage.getItem('cyberkitty_dashboard_layout');
        
        if (savedLayout) {
            try {
                const layout = JSON.parse(savedLayout);
                console.log('📥 Загружаем сохранённый макет', layout);
                
                Object.keys(layout).forEach(widgetId => {
                    const widget = document.getElementById(widgetId);
                    if (widget && layout[widgetId]) {
                        // Восстанавливаем позицию
                        widget.style.top = layout[widgetId].top + 'px';
                        widget.style.left = layout[widgetId].left + 'px';
                        
                        // Восстанавливаем размеры если они сохранены и валидные
                        if (layout[widgetId].width && layout[widgetId].width > 200) {
                            widget.style.width = layout[widgetId].width + 'px';
                        }
                        if (layout[widgetId].height && layout[widgetId].height > 150) {
                            widget.style.height = layout[widgetId].height + 'px';
                        }
                        
                        console.log(`📥 Восстановлен ${widgetId}: ${widget.style.width} x ${widget.style.height} в позиции (${widget.style.left}, ${widget.style.top})`);
                    }
                });
                
                this.showNotification('Макет загружен! 📥');
            } catch (error) {
                console.error('❌ Ошибка загрузки макета:', error);
            }
        }
    }

    resetLayout() {
        console.log('🔄 Сброс расположения к стандартному');
        
        this.updateWidgetsList();
        
        // Возвращаем стандартные позиции
        Object.keys(this.defaultPositions).forEach(widgetId => {
            const widget = document.getElementById(widgetId);
            if (widget) {
                const pos = this.defaultPositions[widgetId];
                widget.style.top = pos.top + 'px';
                widget.style.left = pos.left + 'px';
                widget.classList.add('moving');
                
                setTimeout(() => {
                    widget.classList.remove('moving');
                }, 300);
            }
        });
        
        // Удаляем сохранённое расположение
        localStorage.removeItem('cyberkitty_dashboard_layout');
        this.showNotification('Расположение сброшено! 🔄');
    }

    showLayoutControls() {
        document.getElementById('layout-controls')?.classList.add('show');
    }

    hideLayoutControls() {
        // Скрываем только если не в режиме перетаскивания
        if (!this.isDragMode) {
            document.getElementById('layout-controls')?.classList.remove('show');
        }
    }



    showNotification(message) {
        // Создаём временное уведомление
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 16px;
            background: var(--cyberkitty-bg-light);
            border: 1px solid var(--cyberkitty-blue);
            border-radius: var(--border-radius);
            padding: 12px 16px;
            color: var(--cyberkitty-fg);
            font-size: var(--font-size-small);
            z-index: 1002;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Анимация появления
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Удаление через 3 секунды
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }
}

// Инициализация при загрузке DOM
if (typeof window !== 'undefined') {
    function initLayoutManager() {
        console.log('🚀 Инициализируем LayoutManager');
        window.layoutManager = new LayoutManager();
        console.log('✅ LayoutManager готов к работе');
        

    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLayoutManager);
    } else {
        // DOM уже загружен
        initLayoutManager();
    }
}

// Экспорт для модульных систем
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LayoutManager;
} 