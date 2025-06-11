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
    
    async renderDockerContainers() {
        const container = document.getElementById('docker-containers');
        container.innerHTML = '<div class="loading">Загрузка Docker контейнеров...</div>';
        
        try {
            const response = await fetch('/api/docker-containers');
            this.dockerContainers = await response.json();
            
            let dockerHtml = `
                <div class="docker-sections">
                    <div class="docker-section local-docker">
                        <h3>🖥️ Локальные контейнеры</h3>
                        ${this.renderDockerTable(this.dockerContainers.local, 'local')}
                    </div>
                    <div class="docker-section remote-docker">
                        <h3>🌐 Удаленные серверы</h3>
                        ${this.renderRemoteDockerServers(this.dockerContainers.servers)}
                    </div>
                </div>
            `;
            
            container.innerHTML = dockerHtml;
            
        } catch (error) {
            console.error('❌ Ошибка загрузки Docker контейнеров:', error);
            container.innerHTML = `
                <div class="error-message">
                    <div class="error-icon">❌</div>
                    <span>Ошибка загрузки Docker данных</span>
                    <small>Проверьте подключение к серверам</small>
                </div>
            `;
        }
    }
    
    async renderSSHConnections() {
        const container = document.getElementById('ssh-connections');
        container.innerHTML = '<div class="loading">Загрузка SSH подключений...</div>';
        
        try {
            const response = await fetch('/api/ssh-connections');
            this.sshConnections = await response.json();
            
            let sshHtml = `
                <div class="ssh-sections">
                    <div class="ssh-section servers-status">
                        <h3>🌐 Статус серверов</h3>
                        ${this.renderServersStatus(this.sshConnections.servers_status)}
                    </div>
                    <div class="ssh-section local-connections">
                        <h3>🔐 Локальные SSH подключения</h3>
                        ${this.renderSSHTable(this.sshConnections.local_connections)}
                    </div>
                </div>
            `;
            
            container.innerHTML = sshHtml;
            
        } catch (error) {
            console.error('❌ Ошибка загрузки SSH данных:', error);
            container.innerHTML = `
                <div class="error-message">
                    <div class="error-icon">❌</div>
                    <span>Ошибка загрузки SSH данных</span>
                    <small>Проверьте SSH ключи и доступность серверов</small>
                </div>
            `;
        }
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
    
    renderDockerTable(containers, location) {
        if (!containers || containers.length === 0) {
            return `<div class="empty-state">Контейнеры не найдены</div>`;
        }
        
        let tableHtml = `
            <div class="docker-table">
                <div class="docker-header">
                    <span class="docker-col name">Имя</span>
                    <span class="docker-col image">Образ</span>
                    <span class="docker-col status">Статус</span>
                    <span class="docker-col ports">Порты</span>
                </div>
        `;
        
        containers.forEach((container, index) => {
            const statusClass = this.getDockerStatusClass(container.state);
            
            tableHtml += `
                <div class="docker-row ${index % 2 === 0 ? 'even' : 'odd'}">
                    <span class="docker-col name" title="${container.name}">${this.truncateText(container.name, 20)}</span>
                    <span class="docker-col image" title="${container.image}">${this.truncateText(container.image, 25)}</span>
                    <span class="docker-col status ${statusClass}">${this.formatDockerStatus(container.state)}</span>
                    <span class="docker-col ports" title="${container.ports}">${this.truncateText(container.ports || 'Нет', 15)}</span>
                </div>
            `;
        });
        
        tableHtml += '</div>';
        return tableHtml;
    }
    
    renderRemoteDockerServers(servers) {
        let serversHtml = '';
        
        Object.entries(servers).forEach(([serverName, containers]) => {
            const displayName = serverName === 'got_is_tod' ? '🚀 Got Is Tod' : '💎 Azure Aluminium';
            
            serversHtml += `
                <div class="server-section">
                    <h4>${displayName}</h4>
                    ${this.renderDockerTable(containers, serverName)}
                </div>
            `;
        });
        
        return serversHtml;
    }
    
    renderServersStatus(serversStatus) {
        let statusHtml = '<div class="servers-grid">';
        
        Object.entries(serversStatus).forEach(([serverName, status]) => {
            const displayName = serverName === 'got_is_tod' ? '🚀 Got Is Tod' : '💎 Azure Aluminium';
            const statusClass = this.getServerStatusClass(status.status);
            
            statusHtml += `
                <div class="server-card ${statusClass}">
                    <div class="server-header">
                        <span class="server-name">${displayName}</span>
                        <span class="server-status">${this.formatServerStatus(status.status)}</span>
                    </div>
                    <div class="server-details">
                        ${status.ping ? `<div class="ping">🏓 Пинг: ${status.ping}ms</div>` : ''}
                        ${status.info ? this.renderServerInfo(status.info) : ''}
                        ${status.error ? `<div class="error">❌ ${status.error}</div>` : ''}
                    </div>
                </div>
            `;
        });
        
        statusHtml += '</div>';
        return statusHtml;
    }
    
    renderServerInfo(info) {
        if (!info) return '';
        
        let infoHtml = '';
        if (info.uptime) infoHtml += `<div class="uptime">⏱️ ${info.uptime}</div>`;
        if (info.disk) infoHtml += `<div class="disk">💾 ${info.disk}</div>`;
        if (info.memory) infoHtml += `<div class="memory">🧠 ${info.memory}</div>`;
        
        return infoHtml;
    }
    
    renderSSHTable(connections) {
        if (!connections || connections.length === 0) {
            return `<div class="empty-state">Активные SSH подключения не найдены</div>`;
        }
        
        let tableHtml = `
            <div class="ssh-table">
                <div class="ssh-header">
                    <span class="ssh-col type">Тип</span>
                    <span class="ssh-col local">Локальный</span>
                    <span class="ssh-col remote">Удаленный</span>
                    <span class="ssh-col status">Статус</span>
                </div>
        `;
        
        connections.forEach((conn, index) => {
            tableHtml += `
                <div class="ssh-row ${index % 2 === 0 ? 'even' : 'odd'}">
                    <span class="ssh-col type">${conn.type}</span>
                    <span class="ssh-col local">${conn.local}</span>
                    <span class="ssh-col remote">${conn.remote}</span>
                    <span class="ssh-col status">${this.formatSSHStatus(conn.status)}</span>
                </div>
            `;
        });
        
        tableHtml += '</div>';
        return tableHtml;
    }
    
    getDockerStatusClass(state) {
        switch(state) {
            case 'running': return 'docker-running';
            case 'exited': return 'docker-exited';
            case 'paused': return 'docker-paused';
            case 'created': return 'docker-created';
            default: return 'docker-unknown';
        }
    }
    
    formatDockerStatus(state) {
        const statusMap = {
            'running': '🟢 Запущен',
            'exited': '🔴 Остановлен',
            'paused': '⏸️ Приостановлен',
            'created': '🆕 Создан',
            'restarting': '🔄 Перезапуск'
        };
        return statusMap[state] || '❓ ' + state;
    }
    
    getServerStatusClass(status) {
        switch(status) {
            case 'online': return 'server-online';
            case 'offline': return 'server-offline';
            case 'error': return 'server-error';
            default: return 'server-unknown';
        }
    }
    
    formatServerStatus(status) {
        const statusMap = {
            'online': '🟢 Онлайн',
            'offline': '🔴 Оффлайн',
            'error': '❌ Ошибка'
        };
        return statusMap[status] || '❓ ' + status;
    }
    
    formatSSHStatus(status) {
        const statusMap = {
            'LISTEN': '👂 Прослушивание',
            'ESTABLISHED': '🔗 Установлено'
        };
        return statusMap[status] || status;
    }

    startAutoRefresh() {
        setInterval(() => {
            switch(this.currentTab) {
                case 'processes':
                    this.loadProcesses();
                    break;
                case 'docker':
                    this.renderDockerContainers();
                    break;
                case 'ssh':
                    this.renderSSHConnections();
                    break;
            }
        }, 10000); // Обновляем каждые 10 секунд
    }
}

console.log('⚙️ Monitor widget загружен'); 