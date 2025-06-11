/**
 * 🐳 DOCKER WIDGET
 * Виджет для мониторинга Docker контейнеров с кешированием
 */

class DockerWidget {
    constructor() {
        this.dockerData = null;
        this.lastUpdate = 0;
        this.cacheKey = 'cyberkitty_docker_cache';
        this.cacheDuration = 8000; // 8 секунд (Docker медленнее)
        
        console.log('🐳 Docker widget инициализирован');
    }
    
    async init() {
        // Загружаем кешированные данные
        this.loadFromCache();
        
        // Рендерим сохраненные данные если есть
        if (this.dockerData) {
            this.renderDockerContainers();
        }
        
        // Загружаем свежие данные
        await this.loadDockerData();
        this.startAutoRefresh();
    }
    
    loadFromCache() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                if (Date.now() - data.timestamp < this.cacheDuration) {
                    this.dockerData = data.dockerData;
                    this.lastUpdate = data.timestamp;
                    console.log('🐳 Загружены данные Docker из кеша');
                }
            }
        } catch (error) {
            console.warn('⚠️ Ошибка загрузки кеша Docker:', error);
        }
    }
    
    saveToCache() {
        try {
            const data = {
                dockerData: this.dockerData,
                timestamp: Date.now()
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(data));
        } catch (error) {
            console.warn('⚠️ Ошибка сохранения кеша Docker:', error);
        }
    }
    
    async loadDockerData() {
        try {
            const response = await fetch('/api/docker-containers');
            const data = await response.json();
            
            // Обновляем только если данные изменились
            if (JSON.stringify(this.dockerData) !== JSON.stringify(data)) {
                this.dockerData = data;
                this.lastUpdate = Date.now();
                this.saveToCache();
                this.renderDockerContainers();
            }
            
        } catch (error) {
            console.error('❌ Ошибка загрузки Docker данных:', error);
            this.renderError();
        }
    }
    
    renderDockerContainers() {
        const container = document.getElementById('docker-containers');
        if (!this.dockerData) {
            container.innerHTML = '<div class="loading">Загрузка Docker контейнеров...</div>';
            return;
        }
        
        let dockerHtml = `
            <div class="docker-sections">
                <div class="docker-section local-docker">
                    <h3>🖥️ Локальные контейнеры</h3>
                    ${this.renderDockerTable(this.dockerData.local, 'local')}
                </div>
                <div class="docker-section remote-docker">
                    <h3>🌐 Удаленные серверы</h3>
                    ${this.renderRemoteDockerServers(this.dockerData.servers)}
                </div>
            </div>
        `;
        
        // Добавляем информацию о последнем обновлении
        dockerHtml += `
            <div class="widget-footer">
                <span class="last-update">Обновлено: ${new Date(this.lastUpdate).toLocaleTimeString()}</span>
            </div>
        `;
        
        container.innerHTML = dockerHtml;
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
    
    renderError() {
        const container = document.getElementById('docker-containers');
        container.innerHTML = `
            <div class="error-message">
                <div class="error-icon">❌</div>
                <span>Ошибка загрузки Docker данных</span>
                <small>Проверьте подключение к серверам</small>
            </div>
        `;
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
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
    
    startAutoRefresh() {
        setInterval(() => {
            this.loadDockerData();
        }, 15000); // Обновляем каждые 15 секунд (Docker медленнее)
    }
}

console.log('🐳 Docker widget загружен'); 