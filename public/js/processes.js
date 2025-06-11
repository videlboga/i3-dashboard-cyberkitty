/**
 * 📋 PROCESSES WIDGET
 * Виджет для мониторинга процессов с кешированием
 */

class ProcessesWidget {
    constructor() {
        this.processes = null;
        this.lastUpdate = 0;
        this.cacheKey = 'cyberkitty_processes_cache';
        this.cacheDuration = 5000; // 5 секунд
        
        console.log('📋 Processes widget инициализирован');
    }
    
    async init() {
        // Загружаем кешированные данные
        this.loadFromCache();
        
        // Рендерим сохраненные данные если есть
        if (this.processes) {
            this.renderProcesses();
        }
        
        // Загружаем свежие данные
        await this.loadProcesses();
        this.startAutoRefresh();
    }
    
    loadFromCache() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                if (Date.now() - data.timestamp < this.cacheDuration) {
                    this.processes = data.processes;
                    this.lastUpdate = data.timestamp;
                    console.log('📋 Загружены данные процессов из кеша');
                }
            }
        } catch (error) {
            console.warn('⚠️ Ошибка загрузки кеша процессов:', error);
        }
    }
    
    saveToCache() {
        try {
            const data = {
                processes: this.processes,
                timestamp: Date.now()
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(data));
        } catch (error) {
            console.warn('⚠️ Ошибка сохранения кеша процессов:', error);
        }
    }
    
    async loadProcesses() {
        try {
            const response = await fetch('/api/processes');
            const data = await response.json();
            
            // Обновляем только если данные изменились
            if (JSON.stringify(this.processes) !== JSON.stringify(data)) {
                this.processes = data;
                this.lastUpdate = Date.now();
                this.saveToCache();
                this.renderProcesses();
            }
            
        } catch (error) {
            console.error('❌ Ошибка загрузки процессов:', error);
            this.renderError();
        }
    }
    
    renderProcesses() {
        const container = document.getElementById('process-list');
        if (!this.processes) {
            container.innerHTML = '<div class="loading">Загрузка процессов...</div>';
            return;
        }
        
        let processHtml = `
            <div class="process-header">
                <div class="process-table-header">
                    <span class="process-col pid">PID</span>
                    <span class="process-col name">Процесс</span>
                    <span class="process-col cpu">CPU %</span>
                    <span class="process-col memory">RAM %</span>
                    <span class="process-col status">Статус</span>
                </div>
            </div>
            <div class="process-table">
        `;
        
        this.processes.forEach((process, index) => {
            const cpuClass = this.getCpuClass(process.cpu);
            const memoryClass = this.getMemoryClass(process.memory);
            const statusClass = this.getStatusClass(process.status);
            
            processHtml += `
                <div class="process-row ${index % 2 === 0 ? 'even' : 'odd'}">
                    <span class="process-col pid">${process.pid}</span>
                    <span class="process-col name" title="${process.name}">${this.truncateText(process.name, 15)}</span>
                    <span class="process-col cpu ${cpuClass}">${process.cpu}%</span>
                    <span class="process-col memory ${memoryClass}">${process.memory}%</span>
                    <span class="process-col status ${statusClass}">${this.formatStatus(process.status)}</span>
                </div>
            `;
        });
        
        processHtml += '</div>';
        
        // Добавляем информацию о последнем обновлении
        processHtml += `
            <div class="widget-footer">
                <span class="last-update">Обновлено: ${new Date(this.lastUpdate).toLocaleTimeString()}</span>
            </div>
        `;
        
        container.innerHTML = processHtml;
    }
    
    renderError() {
        const container = document.getElementById('process-list');
        container.innerHTML = `
            <div class="error-message">
                <div class="error-icon">❌</div>
                <span>Ошибка загрузки процессов</span>
                <small>Проверьте подключение к серверу</small>
            </div>
        `;
    }
    
    getCpuClass(cpu) {
        if (cpu >= 50) return 'high-usage';
        if (cpu >= 20) return 'medium-usage';
        return 'low-usage';
    }
    
    getMemoryClass(memory) {
        if (memory >= 30) return 'high-usage';
        if (memory >= 10) return 'medium-usage';
        return 'low-usage';
    }
    
    getStatusClass(status) {
        switch(status) {
            case 'running': return 'status-running';
            case 'sleeping': return 'status-sleeping';
            case 'idle': return 'status-idle';
            case 'zombie': return 'status-zombie';
            default: return 'status-unknown';
        }
    }
    
    formatStatus(status) {
        const statusMap = {
            'running': '🟢 Работает',
            'sleeping': '😴 Спит',
            'idle': '⏸️ Простой',
            'zombie': '🧟 Зомби',
            'stopped': '⏹️ Остановлен'
        };
        return statusMap[status] || '❓ ' + status;
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
    
    startAutoRefresh() {
        setInterval(() => {
            this.loadProcesses();
        }, 10000); // Обновляем каждые 10 секунд
    }
}

console.log('📋 Processes widget загружен'); 