/**
 * 🖥️ SYSTEM WIDGET
 * Виджет для отображения детальной системной информации
 */

class SystemWidget {
    constructor() {
        this.systemDetails = null;
        this.temperatures = null;
        this.diskActivity = null;
        this.currentTab = 'overview';
        
        console.log('🖥️ System widget инициализирован');
    }
    
    async init() {
        this.initializeTabs();
        await this.loadAllData();
        this.startAutoRefresh();
    }
    
    initializeTabs() {
        const tabButtons = document.querySelectorAll('#system-tabs .tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
    }
    
    switchTab(tabName) {
        if (this.currentTab === tabName) return;
        
        // Переключаем активные кнопки
        document.querySelectorAll('#system-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`#system-tabs [data-tab="${tabName}"]`).classList.add('active');
        
        // Переключаем контент
        document.querySelectorAll('#system-content .tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        this.currentTab = tabName;
        
        // Загружаем данные для активной вкладки
        switch(tabName) {
            case 'overview':
                this.renderOverview();
                break;
            case 'memory':
                this.renderMemoryDetails();
                break;
            case 'temp':
                this.renderTemperatures();
                break;
            case 'disks':
                this.renderDiskActivity();
                break;
            case 'layout':
                this.initLayoutControls();
                break;
        }
    }
    
    async loadAllData() {
        try {
            // Загружаем все данные параллельно
            const [detailsResponse, tempResponse, diskResponse] = await Promise.all([
                fetch('/api/system-details'),
                fetch('/api/temperatures'),
                fetch('/api/disk-activity')
            ]);
            
            this.systemDetails = await detailsResponse.json();
            this.temperatures = await tempResponse.json();
            this.diskActivity = await diskResponse.json();
            
            // Рендерим активную вкладку
            this.renderCurrentTab();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки системных данных:', error);
        }
    }
    
    renderCurrentTab() {
        switch(this.currentTab) {
            case 'overview':
                this.renderOverview();
                break;
            case 'memory':
                this.renderMemoryDetails();
                break;
            case 'temp':
                this.renderTemperatures();
                break;
            case 'disks':
                this.renderDiskActivity();
                break;
        }
    }
    
    renderOverview() {
        const container = document.getElementById('system-overview');
        if (!this.systemDetails) {
            container.innerHTML = '<div class="loading">Загрузка...</div>';
            return;
        }
        
        const uptime = this.formatUptime(this.systemDetails.uptime);
        
        container.innerHTML = `
            <div class="overview-grid">
                <div class="overview-card">
                    <div class="card-icon">🧠</div>
                    <div class="card-info">
                        <div class="card-title">CPU</div>
                        <div class="card-value">${this.systemDetails.cpu_count} ядер</div>
                        <div class="card-subtitle">${this.systemDetails.cpu_freq} MHz</div>
                    </div>
                </div>
                
                <div class="overview-card">
                    <div class="card-icon">💾</div>
                    <div class="card-info">
                        <div class="card-title">RAM</div>
                        <div class="card-value">${this.systemDetails.memory.total} GB</div>
                        <div class="card-subtitle">${this.systemDetails.memory.percent}% использовано</div>
                    </div>
                </div>
                
                <div class="overview-card">
                    <div class="card-icon">🔄</div>
                    <div class="card-info">
                        <div class="card-title">SWAP</div>
                        <div class="card-value">${this.systemDetails.swap.total} GB</div>
                        <div class="card-subtitle">${this.systemDetails.swap.percent}% использовано</div>
                    </div>
                </div>
                
                <div class="overview-card">
                    <div class="card-icon">⏱️</div>
                    <div class="card-info">
                        <div class="card-title">Uptime</div>
                        <div class="card-value">${uptime.days}д ${uptime.hours}ч</div>
                        <div class="card-subtitle">${uptime.minutes}м</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderMemoryDetails() {
        const container = document.getElementById('memory-details');
        if (!this.systemDetails) {
            container.innerHTML = '<div class="loading">Загрузка...</div>';
            return;
        }
        
        const memory = this.systemDetails.memory;
        const swap = this.systemDetails.swap;
        
        container.innerHTML = `
            <div class="memory-section">
                <h3>💾 Оперативная память</h3>
                <div class="memory-stats">
                    <div class="memory-bar">
                        <div class="memory-bar-fill" style="width: ${memory.percent}%"></div>
                        <div class="memory-bar-text">${memory.used} GB / ${memory.total} GB (${memory.percent}%)</div>
                    </div>
                    <div class="memory-details-grid">
                        <div class="memory-item">
                            <span class="memory-label">Доступно:</span>
                            <span class="memory-value">${memory.available} GB</span>
                        </div>
                        <div class="memory-item">
                            <span class="memory-label">Кэш:</span>
                            <span class="memory-value">${memory.cached} GB</span>
                        </div>
                        <div class="memory-item">
                            <span class="memory-label">Буферы:</span>
                            <span class="memory-value">${memory.buffers} GB</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="swap-section">
                <h3>🔄 Файл подкачки</h3>
                <div class="swap-stats">
                    <div class="memory-bar">
                        <div class="memory-bar-fill swap" style="width: ${swap.percent}%"></div>
                        <div class="memory-bar-text">${swap.used} GB / ${swap.total} GB (${swap.percent}%)</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderTemperatures() {
        const container = document.getElementById('temperature-sensors');
        if (!this.temperatures) {
            container.innerHTML = '<div class="loading">Загрузка...</div>';
            return;
        }
        
        let tempHtml = '<div class="temperature-grid">';
        
        for (const [sensor, data] of Object.entries(this.temperatures)) {
            const tempClass = this.getTempClass(data.current, data.high, data.critical);
            const tempIcon = this.getTempIcon(data.current, data.high, data.critical);
            
            tempHtml += `
                <div class="temp-card ${tempClass}">
                    <div class="temp-icon">${tempIcon}</div>
                    <div class="temp-info">
                        <div class="temp-sensor">${this.formatSensorName(sensor)}</div>
                        <div class="temp-value">${data.current}°C</div>
                        <div class="temp-range">${data.high ? `Max: ${data.high}°C` : ''}</div>
                    </div>
                </div>
            `;
        }
        
        tempHtml += '</div>';
        container.innerHTML = tempHtml;
    }
    
    renderDiskActivity() {
        const container = document.getElementById('disk-activity');
        if (!this.diskActivity) {
            container.innerHTML = '<div class="loading">Загрузка...</div>';
            return;
        }
        
        let diskHtml = '<div class="disk-sections">';
        
        // Разделы
        if (this.diskActivity.partitions && this.diskActivity.partitions.length > 0) {
            diskHtml += `
                <div class="partitions-section">
                    <h3>💽 Разделы диска</h3>
                    <div class="partitions-grid">
            `;
            
            this.diskActivity.partitions.forEach(partition => {
                diskHtml += `
                    <div class="partition-card">
                        <div class="partition-header">
                            <span class="partition-device">${partition.device}</span>
                            <span class="partition-mount">${partition.mountpoint}</span>
                        </div>
                        <div class="partition-usage">
                            <div class="usage-bar">
                                <div class="usage-bar-fill" style="width: ${partition.percent}%"></div>
                            </div>
                            <div class="usage-text">
                                ${partition.used} GB / ${partition.total} GB (${partition.percent}%)
                            </div>
                        </div>
                        <div class="partition-info">
                            <span>Свободно: ${partition.free} GB</span>
                            <span>FS: ${partition.fstype}</span>
                        </div>
                    </div>
                `;
            });
            
            diskHtml += '</div></div>';
        }
        
        // I/O статистика
        if (this.diskActivity.io_stats && Object.keys(this.diskActivity.io_stats).length > 0) {
            diskHtml += `
                <div class="io-section">
                    <h3>📊 Дисковая активность</h3>
                    <div class="io-grid">
            `;
            
            for (const [device, stats] of Object.entries(this.diskActivity.io_stats)) {
                diskHtml += `
                    <div class="io-card">
                        <div class="io-device">${device}</div>
                        <div class="io-stats">
                            <div class="io-stat">
                                <span class="io-label">Чтение:</span>
                                <span class="io-value">${this.formatBytes(stats.read_bytes)}</span>
                            </div>
                            <div class="io-stat">
                                <span class="io-label">Запись:</span>
                                <span class="io-value">${this.formatBytes(stats.write_bytes)}</span>
                            </div>
                            <div class="io-stat">
                                <span class="io-label">Операции чтения:</span>
                                <span class="io-value">${stats.read_count.toLocaleString()}</span>
                            </div>
                            <div class="io-stat">
                                <span class="io-label">Операции записи:</span>
                                <span class="io-value">${stats.write_count.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            diskHtml += '</div></div>';
        }
        
        diskHtml += '</div>';
        container.innerHTML = diskHtml;
    }
    
    formatUptime(timestamp) {
        const now = Date.now() / 1000;
        const uptimeSeconds = now - timestamp;
        
        const days = Math.floor(uptimeSeconds / 86400);
        const hours = Math.floor((uptimeSeconds % 86400) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        
        return { days, hours, minutes };
    }
    
    getTempClass(current, high, critical) {
        if (critical && current >= critical * 0.9) return 'temp-critical';
        if (high && current >= high * 0.8) return 'temp-warning';
        return 'temp-normal';
    }
    
    getTempIcon(current, high, critical) {
        if (critical && current >= critical * 0.9) return '🔥';
        if (high && current >= high * 0.8) return '🌡️';
        return '❄️';
    }
    
    formatSensorName(sensor) {
        return sensor
            .replace('_', ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .replace('Cpu', 'CPU')
            .replace('Nvme', 'NVMe');
    }
    
    formatBytes(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    initLayoutControls() {
        // Инициализируем кнопки управления макетом
        const enableDragBtn = document.getElementById('enable-drag-mode');
        const resetLayoutBtn = document.getElementById('reset-widget-layout');
        const saveLayoutBtn = document.getElementById('save-widget-layout');
        
        // Функция инициализации, которая может быть отложена
        const doInit = () => {
            console.log('🎯 Инициализируем управление layout в system.js');
            
            // Проверяем существование LayoutManager
            if (typeof window.layoutManager === 'undefined') {
                document.getElementById('layout-info').innerHTML = `
                    <p style="color: #ef4444;"><strong>⚠️ Ошибка:</strong></p>
                    <p>LayoutManager не загружен. Пожалуйста, перезагрузите страницу.</p>
                `;
                return;
            }

            this.setupLayoutButtons(enableDragBtn, resetLayoutBtn, saveLayoutBtn);
        };

        // Если LayoutManager уже готов - инициализируем сразу
        if (typeof window.layoutManager !== 'undefined') {
            doInit();
        } else {
            // Иначе ждём появления LayoutManager
            console.log('🎯 LayoutManager ещё не готов, ждём...');
            const checkInterval = setInterval(() => {
                if (typeof window.layoutManager !== 'undefined') {
                    console.log('🎯 LayoutManager готов!');
                    clearInterval(checkInterval);
                    doInit();
                }
            }, 100);
            
            // Таймаут на случай, если что-то пошло не так
            setTimeout(() => {
                clearInterval(checkInterval);
                if (typeof window.layoutManager === 'undefined') {
                    console.error('❌ LayoutManager не загрузился в течение 5 секунд');
                }
            }, 5000);
        }
    }

    setupLayoutButtons(enableDragBtn, resetLayoutBtn, saveLayoutBtn) {
        
        // Обработчик включения/выключения режима перетаскивания
        enableDragBtn.addEventListener('click', () => {
            console.log('🎯 Клик по кнопке режима перетаскивания (system.js)');
            window.layoutManager.toggleDragMode();
            
            // Обновляем статус после переключения
            setTimeout(() => {
                if (window.layoutManager.isDragMode) {
                    this.updateLayoutStatus('Режим перетаскивания включен. Теперь можно перемещать виджеты!');
                } else {
                    this.updateLayoutStatus('Режим перетаскивания выключен');
                }
            }, 100);
        });
        
        // Обработчик сброса макета
        resetLayoutBtn.addEventListener('click', () => {
            if (confirm('Сбросить расположение виджетов к значениям по умолчанию?')) {
                window.layoutManager.resetLayout();
                this.updateLayoutStatus('Макет сброшен к значениям по умолчанию');
            }
        });
        
        // Обработчик сохранения макета
        saveLayoutBtn.addEventListener('click', () => {
            window.layoutManager.saveLayout();
            this.updateLayoutStatus('Макет сохранен в localStorage');
        });
        
        // Обновляем статус
        this.updateLayoutStatus('Готов к работе');
    }
    
    updateLayoutStatus(message) {
        const statusElement = document.querySelector('#layout-info p');
        if (statusElement) {
            statusElement.innerHTML = `<strong>Статус:</strong> ${message}`;
        }
    }

    startAutoRefresh() {
        setInterval(() => {
            this.loadAllData();
        }, 10000); // Обновляем каждые 10 секунд
    }
}

console.log('🖥️ System widget загружен'); 