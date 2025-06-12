/**
 * 🎯 Layout Manager v26 - CyberKitty Dashboard
 * 💡 ПРОСТОЕ РЕШЕНИЕ: 
 * 🔒 Вне режима редактирования - размеры заблокированы
 * ✏️ В режиме редактирования - полная свобода изменения размеров
 * 💾 При выходе - сохранить и заблокировать
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
        console.log('🚀 [Layout Manager v26] ПРОСТОЕ РЕШЕНИЕ');
        console.log('🔒 [v26] Размеры заблокированы до режима редактирования');
        
        this.setupEventListeners();
        this.loadLayout();
        this.updateWidgetsList();
        
        // Применяем сохранённый макет и блокируем размеры
        setTimeout(() => {
            this.applyLayout();
            this.lockAllWidgets();
        }, 500);
        
        console.log('✅ [v26] Layout Manager готов');
    }

    lockAllWidgets() {
        console.log('🔒 [v26] Блокирую размеры всех виджетов...');
        
        this.widgets.forEach(widget => {
            // Убираем возможность изменения размеров
            widget.style.resize = 'none';
            widget.style.overflow = 'visible';
            
            // Убираем max-width/max-height чтобы не ограничивать
            widget.style.maxWidth = '';
            widget.style.maxHeight = '';
            
            console.log(`🔒 [v26] Заблокирован: ${widget.id}`);
        });
        
        console.log('✅ [v26] Все виджеты заблокированы');
    }

    unlockAllWidgets() {
        console.log('🔓 [v26] Разблокирую размеры всех виджетов...');
        
        this.widgets.forEach(widget => {
            // Включаем возможность изменения размеров
            widget.style.resize = 'both';
            widget.style.overflow = 'auto';
            
            console.log(`🔓 [v26] Разблокирован: ${widget.id}`);
        });
        
        console.log('✅ [v26] Все виджеты разблокированы для редактирования');
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
        console.log('🚀 [v26] Включаем режим перетаскивания...');
        this.isDragMode = true;
        this.updateWidgetsList();
        
        // 🔓 РАЗБЛОКИРУЕМ все виджеты для редактирования
        this.unlockAllWidgets();
        
        console.log('🎯 [v26] Обрабатываем виджеты:', this.widgets.length);
        
        // Получаем сохраненные размеры
        const savedLayout = localStorage.getItem('cyberkitty_dashboard_layout');
        let layout = {};
        try {
            layout = savedLayout ? JSON.parse(savedLayout) : {};
        } catch (e) {
            console.error('❌ Ошибка чтения сохраненного макета:', e);
        }
        
        this.widgets.forEach((widget, index) => {
            console.log(`📏 [v26] Применяю размер: ${widget.id}`);
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
            
            // ИСПОЛЬЗУЕМ СОХРАНЕННЫЕ РАЗМЕРЫ ЕСЛИ ОНИ ЕСТЬ
            let finalWidth = defaultWidth;
            let finalHeight = defaultHeight;
            
            if (layout[widget.id] && layout[widget.id].width && layout[widget.id].height) {
                finalWidth = Math.max(layout[widget.id].width, defaultWidth);
                finalHeight = Math.max(layout[widget.id].height, defaultHeight);
                console.log(`📏 [v26] Применяю размер: ${widget.id} -> ${finalWidth}px x ${finalHeight}px (сохраненные)`);
            } else {
                console.log(`📏 [v26] Применяю размер: ${widget.id} -> ${finalWidth}px x ${finalHeight}px (по умолчанию)`);
            }
            
            // Принудительно включаем resize
            widget.style.resize = 'both';
            widget.style.overflow = 'auto';
            
            // 🚀 ПРИНУДИТЕЛЬНО устанавливаем размеры через минимальные размеры
            widget.style.width = finalWidth + 'px';
            widget.style.height = finalHeight + 'px';
            widget.style.minWidth = finalWidth + 'px';
            widget.style.minHeight = finalHeight + 'px';
            
            console.log(`✅ [v26] Размер применен: ${widget.id} -> ${widget.style.width} x ${widget.style.height}`);
            
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
            console.log('🎯 [v26] Grid контейнер найден');
            grid.classList.add('drag-mode');
        } else {
            console.log('❌ [v26] Grid контейнер НЕ найден!');
        }
        
        console.log('✅ [v26] Режим перетаскивания включён');
    }

    disableDragMode() {
        this.isDragMode = false;
        console.log('🚀 [v26] Выключаем режим перетаскивания...');
        
        this.widgets.forEach(widget => {
            widget.classList.remove('draggable', 'dragging');
            
            // Отключаем resize
            widget.style.resize = 'none';
            widget.style.overflow = 'visible';
            
            // ПРИНУДИТЕЛЬНО сохраняем абсолютное позиционирование в обычном режиме
            widget.style.position = 'absolute';
            
            // Удаляем обработчики с заголовков
            const header = widget.querySelector('.widget-header');
            if (header) {
                header.style.cursor = '';
                header.removeEventListener('mousedown', this.boundHandlers.dragStart);
            }
        });

        const grid = document.querySelector('.dashboard-grid');
        if (grid) {
            grid.classList.remove('drag-mode');
            // В обычном режиме тоже используем block для абсолютного позиционирования
            grid.style.display = 'block';
        }

        // Удаляем глобальные обработчики если были добавлены
        document.removeEventListener('mousemove', this.boundHandlers.mouseMove);
        document.removeEventListener('mouseup', this.boundHandlers.mouseUp);
        
        // Сохраняем макет при выходе из режима перетаскивания
        this.saveLayout();
        
        // Применяем сохранённые позиции после сохранения
        this.applyLayout();
        
        // 🔒 БЛОКИРУЕМ все виджеты после редактирования
        this.lockAllWidgets();
        
        console.log('✅ [v26] Режим перетаскивания выключен');
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

    // ResizeObserver больше не нужны - используется простая блокировка/разблокировка

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
                console.log('📥 [v26] Загружаем сохранённый макет', layout);
                
                Object.keys(layout).forEach(widgetId => {
                    const widget = document.getElementById(widgetId);
                    if (widget && layout[widgetId]) {
                        // Восстанавливаем позицию
                        widget.style.top = layout[widgetId].top + 'px';
                        widget.style.left = layout[widgetId].left + 'px';
                        
                        // 🚀 ПРИНУДИТЕЛЬНО восстанавливаем размеры с минимальными значениями
                        if (layout[widgetId].width && layout[widgetId].width > 200) {
                            widget.style.width = layout[widgetId].width + 'px';
                            widget.style.minWidth = layout[widgetId].width + 'px';
                        }
                        if (layout[widgetId].height && layout[widgetId].height > 150) {
                            widget.style.height = layout[widgetId].height + 'px';
                            widget.style.minHeight = layout[widgetId].height + 'px';
                        }
                        
                        console.log(`📏 [v26] Применяю размер: ${widgetId} -> ${widget.style.width} x ${widget.style.height} в позиции (${widget.style.left}, ${widget.style.top})`);
                    }
                });
                
                this.showNotification('Макет загружен! 📥');
            } catch (error) {
                console.error('❌ Ошибка загрузки макета:', error);
            }
        } else {
            console.log('ℹ️ [v26] Сохраненного макета нет, используем размеры по умолчанию');
        }
    }

    applyLayout() {
        const savedLayout = localStorage.getItem('cyberkitty_dashboard_layout');
        
        if (savedLayout) {
            try {
                const layout = JSON.parse(savedLayout);
                console.log('🎯 [v26] Применяем сохранённый макет в обычном режиме', layout);
                
                Object.keys(layout).forEach(widgetId => {
                    const widget = document.getElementById(widgetId);
                    if (widget && layout[widgetId]) {
                        // ПРИНУДИТЕЛЬНО устанавливаем абсолютные позиции
                        widget.style.position = 'absolute';
                        widget.style.top = layout[widgetId].top + 'px';
                        widget.style.left = layout[widgetId].left + 'px';
                        widget.style.width = layout[widgetId].width + 'px';
                        widget.style.height = layout[widgetId].height + 'px';
                        
                        // Убираем grid позиционирование
                        widget.style.gridColumn = 'unset';
                        widget.style.gridRow = 'unset';
                        
                        console.log(`🎯 [v26] Применены позиции: ${widgetId} -> (${layout[widgetId].left}, ${layout[widgetId].top}) размер ${layout[widgetId].width}x${layout[widgetId].height}`);
                    }
                });
                
                console.log('✅ [v26] Макет применён в обычном режиме');
            } catch (error) {
                console.error('❌ Ошибка применения макета:', error);
            }
        } else {
            console.log('ℹ️ [v26] Нет сохранённого макета, используем CSS Grid');
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