/**
 * 🔐 SSH WIDGET
 * Виджет для мониторинга SSH подключений с кешированием
 */

class SSHWidget {
    constructor() {
        this.sshData = null;
        this.lastUpdate = 0;
        this.cacheKey = 'cyberkitty_ssh_cache';
        this.cacheDuration = 10000; // 10 секунд (SSH быстрее)
        
        console.log('🔐 SSH widget инициализирован');
    }
    
    async init() {
        // Загружаем кешированные данные
        this.loadFromCache();
        
        // Рендерим сохраненные данные если есть
        if (this.sshData) {
            this.renderSSHConnections();
        }
        
        // Загружаем свежие данные
        await this.loadSSHData();
        this.startAutoRefresh();
    }
    
    loadFromCache() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                if (Date.now() - data.timestamp < this.cacheDuration) {
                    this.sshData = data.sshData;
                    this.lastUpdate = data.timestamp;
                    console.log('🔐 Загружены данные SSH из кеша');
                }
            }
        } catch (error) {
            console.warn('⚠️ Ошибка загрузки кеша SSH:', error);
        }
    }
    
    saveToCache() {
        try {
            const data = {
                sshData: this.sshData,
                timestamp: Date.now()
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(data));
        } catch (error) {
            console.warn('⚠️ Ошибка сохранения кеша SSH:', error);
        }
    }
    
    async loadSSHData() {
        try {
            const response = await fetch('/api/ssh-connections');
            const data = await response.json();
            
            // Обновляем только если данные изменились
            if (JSON.stringify(this.sshData) !== JSON.stringify(data)) {
                this.sshData = data;
                this.lastUpdate = Date.now();
                this.saveToCache();
                this.renderSSHConnections();
            }
            
        } catch (error) {
            console.error('❌ Ошибка загрузки SSH данных:', error);
            this.renderError();
        }
    }
    
    renderSSHConnections() {
        const container = document.getElementById('ssh-connections');
        if (!this.sshData) {
            container.innerHTML = '<div class="loading">Загрузка SSH данных...</div>';
            return;
        }
        
        let sshHtml = `
            <div class="ssh-sections">
                <div class="ssh-section local-ssh">
                    <h3>🖥️ Локальные SSH подключения</h3>
                    ${this.renderSSHTable(this.sshData.local)}
                </div>
                <div class="ssh-section remote-servers">
                    <h3>🌐 Состояние серверов</h3>
                    ${this.renderServerStatus(this.sshData.servers)}
                </div>
            </div>
        `;
        
        // Добавляем информацию о последнем обновлении
        sshHtml += `
            <div class="widget-footer">
                <span class="last-update">Обновлено: ${new Date(this.lastUpdate).toLocaleTimeString()}</span>
            </div>
        `;
        
        container.innerHTML = sshHtml;
    }
    
    renderSSHTable(connections) {
        if (!connections || connections.length === 0) {
            return `<div class="empty-state">Активные SSH подключения не найдены</div>`;
        }
        
        let tableHtml = `
            <div class="ssh-table">
                <div class="ssh-header">
                    <span class="ssh-col protocol">Протокол</span>
                    <span class="ssh-col local">Локальный адрес</span>
                    <span class="ssh-col remote">Удаленный адрес</span>
                    <span class="ssh-col status">Статус</span>
                </div>
        `;
        
        connections.forEach((connection, index) => {
            tableHtml += `
                <div class="ssh-row ${index % 2 === 0 ? 'even' : 'odd'}">
                    <span class="ssh-col protocol">${connection.protocol || 'TCP'}</span>
                    <span class="ssh-col local" title="${connection.local_address}">${this.truncateText(connection.local_address, 20)}</span>
                    <span class="ssh-col remote" title="${connection.remote_address}">${this.truncateText(connection.remote_address, 20)}</span>
                    <span class="ssh-col status ssh-listening">🟢 Слушает</span>
                </div>
            `;
        });
        
        tableHtml += '</div>';
        return tableHtml;
    }
    
    renderServerStatus(servers) {
        if (!servers || Object.keys(servers).length === 0) {
            return `<div class="empty-state">Серверы не найдены</div>`;
        }
        
        let serversHtml = '<div class="servers-grid">';
        
        Object.entries(servers).forEach(([serverName, serverData]) => {
            const displayName = this.getServerDisplayName(serverName);
            const statusClass = this.getServerStatusClass(serverData.status);
            
            serversHtml += `
                <div class="server-card ${statusClass}">
                    <div class="server-header">
                        <span class="server-name">${displayName}</span>
                        <span class="server-status">${this.formatServerStatus(serverData.status)}</span>
                    </div>
                    <div class="server-details">
                        ${this.renderServerDetails(serverData)}
                    </div>
                </div>
            `;
        });
        
        serversHtml += '</div>';
        return serversHtml;
    }
    
    renderServerDetails(serverData) {
        if (serverData.status === 'offline') {
            return '<div class="error">❌ Сервер недоступен</div>';
        }
        
        if (serverData.status === 'error') {
            return `<div class="error">⚠️ ${serverData.error || 'Ошибка подключения'}</div>`;
        }
        
        return `
            <div class="ping">🏓 Пинг: ${serverData.ping || 'N/A'} мс</div>
            <div class="uptime">⏱️ Время работы: ${serverData.uptime || 'Неизвестно'}</div>
            <div class="memory">💾 ОЗУ: ${serverData.memory || 'N/A'}%</div>
            <div class="disk">💿 Диск: ${serverData.disk || 'N/A'}%</div>
        `;
    }
    
    renderError() {
        const container = document.getElementById('ssh-connections');
        container.innerHTML = `
            <div class="error-message">
                <div class="error-icon">❌</div>
                <span>Ошибка загрузки SSH данных</span>
                <small>Проверьте сетевое подключение</small>
            </div>
        `;
    }
    
    getServerDisplayName(serverName) {
        const nameMap = {
            'got_is_tod': '🚀 Got Is Tod',
            'azure-aluminium': '💎 Azure Aluminium'
        };
        return nameMap[serverName] || serverName;
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
            'offline': '🔴 Офлайн',
            'error': '⚠️ Ошибка'
        };
        return statusMap[status] || '❓ Неизвестно';
    }
    
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
    
    startAutoRefresh() {
        setInterval(() => {
            this.loadSSHData();
        }, 12000); // Обновляем каждые 12 секунд
    }
}

console.log('🔐 SSH widget загружен'); 