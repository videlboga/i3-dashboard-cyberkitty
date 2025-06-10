/**
 * ⚙️ MONITOR WIDGET
 * Виджет для мониторинга процессов, Docker контейнеров и SSH подключений
 */

class MonitorWidget {
    constructor() {
        this.processes = null;
        this.dockerContainers = null;
        this.sshConnections = null;
        this.currentTab = 'processes';
        
        console.log('⚙️ Monitor widget инициализирован');
    }
    
    async init() {
        this.initializeTabs();
        await this.loadProcesses();
        this.startAutoRefresh();
    }
    
    initializeTabs() {
        const tabButtons = document.querySelectorAll('#monitor-tabs .tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
    }
    
    switchTab(tabName) {
        if (this.currentTab === tabName) return;
        
        // Переключаем активные кнопки
        document.querySelectorAll('#monitor-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`#monitor-tabs [data-tab="${tabName}"]`).classList.add('active');
        
        // Переключаем контент
        document.querySelectorAll('#monitor-content .tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        this.currentTab = tabName;
        
        // Загружаем данные для активной вкладки
        switch(tabName) {
            case 'processes':
                this.renderProcesses();
                break;
            case 'docker':
                this.renderDockerContainers();
                break;
            case 'ssh':
                this.renderSSHConnections();
                break;
        }
    }
    
    async loadProcesses() {
        try {
            const response = await fetch('/api/processes');
            this.processes = await response.json();
            
            if (this.currentTab === 'processes') {
                this.renderProcesses();
            }
            
        } catch (error) {
            console.error('❌ Ошибка загрузки процессов:', error);
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
        container.innerHTML = processHtml;
    }
    
    renderDockerContainers() {
        const container = document.getElementById('docker-containers');
        
        // Заглушка для Docker
        container.innerHTML = `
            <div class="coming-soon">
                <div class="coming-soon-icon">🐳</div>
                <span>Docker мониторинг</span>
                <small>Скоро будет добавлено</small>
            </div>
        `;
    }
    
    renderSSHConnections() {
        const container = document.getElementById('ssh-connections');
        
        // Заглушка для SSH
        container.innerHTML = `
            <div class="coming-soon">
                <div class="coming-soon-icon">🔐</div>
                <span>SSH мониторинг</span>
                <small>Скоро будет добавлено</small>
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
            if (this.currentTab === 'processes') {
                this.loadProcesses();
            }
        }, 5000); // Обновляем каждые 5 секунд
    }
}

console.log('⚙️ Monitor widget загружен'); 