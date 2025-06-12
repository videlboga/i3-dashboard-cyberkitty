#!/usr/bin/env python3
"""
🚀 Cyberkitty Dashboard Development Server
Простой HTTP сервер для разработки и тестирования дашборда
"""

import http.server
import socketserver
# import webbrowser  # Убрано согласно пользовательскому требованию
import os
import sys
import json
import subprocess
import time
from pathlib import Path

# Настройки сервера
PORT = 8082
HOST = "localhost"
PUBLIC_DIR = "public"

class CyberkittyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Кастомный обработчик для дашборда с CORS поддержкой"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)
    
    def do_GET(self):
        print(f"🔍 GET запрос: {self.path}")
        
        # Обработка API запросов ПЕРЕД стандартной обработкой
        if self.path == '/api/wallpaper':
            self.serve_wallpaper()
            return
        elif self.path == '/api/system-info':
            self.serve_system_info()
            return
        elif self.path == '/api/system-details':
            self.serve_system_details()
            return
        elif self.path == '/api/processes':
            self.serve_processes()
            return
        elif self.path == '/api/temperatures':
            self.serve_temperatures()
            return
        elif self.path == '/api/disk-activity':
            self.serve_disk_activity()
            return
        elif self.path == '/api/calendar-config':
            self.serve_calendar_config()
            return
        elif self.path == '/api/docker-containers':
            self.serve_docker_containers()
            return
        elif self.path == '/api/ssh-connections':
            self.serve_ssh_connections()
            return
        
        # Обычные файлы через стандартный обработчик
        super().do_GET()
    
    def do_POST(self):
        """Обработка POST запросов для API"""
        print(f"📝 POST запрос: {self.path}")
        
        if self.path == '/api/lock-screen':
            self.handle_lock_screen()
        elif self.path == '/api/pomodoro-status':
            self.handle_pomodoro_status()
        else:
            self.send_response(404)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
    
    def handle_lock_screen(self):
        """Запуск аниме локера"""
        try:
            # Читаем данные запроса
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode())
            
            print(f"🔒 Запрос блокировки экрана: {data}")
            
            # Записываем информацию о времени окончания перерыва
            if data.get('sessionType') in ['shortBreak', 'longBreak']:
                break_end_time = int(time.time()) + data.get('timeRemaining', 300)
                with open('/tmp/pomodoro_break_end.txt', 'w') as f:
                    f.write(str(break_end_time))
                print(f"⏰ Время окончания перерыва записано: {break_end_time}")
            
            # Запускаем аниме локер
            lock_command = data.get('lockCommand', '/home/cyberkitty/.local/bin/anime-lock-python')
            
            if os.path.exists(lock_command):
                print(f"🎌 Запускаю аниме локер: {lock_command}")
                # Запускаем в фоне
                subprocess.Popen([lock_command], 
                               stdout=subprocess.DEVNULL, 
                               stderr=subprocess.DEVNULL)
                
                response = {'status': 'success', 'message': 'Аниме локер запущен'}
                self.send_response(200)
            else:
                print(f"❌ Аниме локер не найден: {lock_command}")
                response = {'status': 'error', 'message': 'Аниме локер не найден'}
                self.send_response(404)
            
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            print(f"❌ Ошибка запуска локера: {e}")
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
    
    def handle_pomodoro_status(self):
        """Запись статуса помодоро"""
        try:
            # Читаем данные запроса
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode())
            
            status = data.get('status', '')
            print(f"📝 Записываю статус помодоро: {status}")
            
            # Записываем в файл для аниме локера
            with open('/tmp/pomodoro_status.txt', 'w') as f:
                f.write(status)
            
            response = {'status': 'success'}
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            print(f"❌ Ошибка записи статуса: {e}")
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
    
    def do_DELETE(self):
        """Обработка DELETE запросов"""
        if self.path == '/api/pomodoro-status':
            try:
                # Удаляем файл статуса
                import pathlib
                pathlib.Path('/tmp/pomodoro_status.txt').unlink(missing_ok=True)
                pathlib.Path('/tmp/pomodoro_break_end.txt').unlink(missing_ok=True)
                
                response = {'status': 'success'}
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode())
                
            except Exception as e:
                print(f"❌ Ошибка удаления статуса: {e}")
                self.send_response(500)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
        else:
            self.send_response(404)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
    
    def serve_wallpaper(self):
        """Отдаём текущие обои рабочего стола"""
        print("🖼️  Обрабатываю запрос обоев...")
        try:
            # Пытаемся получить путь к обоям из nitrogen
            result = subprocess.run(['cat', os.path.expanduser('~/.config/nitrogen/bg-saved.cfg')], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"📄 Конфиг nitrogen: {result.stdout}")
                # Ищем путь к файлу в конфиге nitrogen
                for line in result.stdout.split('\n'):
                    if line.startswith('file='):
                        wallpaper_path = line.split('=', 1)[1]
                        print(f"🔍 Найден путь: {wallpaper_path}")
                        if os.path.exists(wallpaper_path):
                            print(f"✅ Файл существует, отдаю: {wallpaper_path}")
                            # Отдаём файл обоев
                            with open(wallpaper_path, 'rb') as f:
                                self.send_response(200)
                                # Определяем тип файла
                                if wallpaper_path.lower().endswith('.jpg') or wallpaper_path.lower().endswith('.jpeg'):
                                    self.send_header('Content-Type', 'image/jpeg')
                                elif wallpaper_path.lower().endswith('.png'):
                                    self.send_header('Content-Type', 'image/png')
                                else:
                                    self.send_header('Content-Type', 'image/jpeg')
                                
                                self.send_header('Access-Control-Allow-Origin', '*')
                                self.end_headers()
                                self.wfile.write(f.read())
                                return
                        else:
                            print(f"❌ Файл не существует: {wallpaper_path}")
            
            print("❌ Обои не найдены, отдаю 404")
            # Если не найдено, отдаём 404
            self.send_response(404)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
        except Exception as e:
            print(f"❌ Ошибка получения обоев: {e}")
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
    
    def serve_system_info(self):
        """API для базовой системной информации"""
        print("📊 Обрабатываю запрос базовой системной информации...")
        try:
            try:
                import psutil
                system_info = {
                    'cpu': round(psutil.cpu_percent(interval=1), 1),
                    'memory': round(psutil.virtual_memory().percent, 1),
                    'disk': round(psutil.disk_usage('/').percent, 1)
                }
                print(f"📈 Базовая системная информация: {system_info}")
            except ImportError:
                # Fallback если psutil не установлен
                print("⚠️  psutil не установлен, использую тестовые данные")
                system_info = {
                    'cpu': 25.5,
                    'memory': 45.2,
                    'disk': 67.8
                }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(system_info).encode())
            
        except Exception as e:
            print(f"❌ Ошибка получения базовой системной информации: {e}")
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

    def serve_system_details(self):
        """API для детальной системной информации"""
        print("🔬 Обрабатываю запрос детальной системной информации...")
        try:
            try:
                import psutil
                
                # Получаем детальную информацию о памяти
                memory = psutil.virtual_memory()
                swap = psutil.swap_memory()
                
                system_details = {
                    'memory': {
                        'total': round(memory.total / (1024**3), 2),  # GB
                        'available': round(memory.available / (1024**3), 2),  # GB
                        'used': round((memory.total - memory.available) / (1024**3), 2),  # GB
                        'percent': round(memory.percent, 1),
                        'cached': round(getattr(memory, 'cached', 0) / (1024**3), 2),  # GB
                        'buffers': round(getattr(memory, 'buffers', 0) / (1024**3), 2)  # GB
                    },
                    'swap': {
                        'total': round(swap.total / (1024**3), 2),  # GB
                        'used': round(swap.used / (1024**3), 2),  # GB
                        'percent': round(swap.percent, 1)
                    },
                    'uptime': round(psutil.boot_time()),
                    'cpu_count': psutil.cpu_count(),
                    'cpu_freq': round(psutil.cpu_freq().current) if psutil.cpu_freq() else 0
                }
                
                print(f"🔬 Детальная системная информация: {system_details}")
                
            except ImportError:
                print("⚠️  psutil не установлен, использую тестовые данные")
                system_details = {
                    'memory': {
                        'total': 16.0,
                        'available': 8.5,
                        'used': 7.5,
                        'percent': 46.9,
                        'cached': 2.3,
                        'buffers': 0.8
                    },
                    'swap': {
                        'total': 8.0,
                        'used': 1.2,
                        'percent': 15.0
                    },
                    'uptime': 1640995200,
                    'cpu_count': 8,
                    'cpu_freq': 3400
                }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(system_details).encode())
            
        except Exception as e:
            print(f"❌ Ошибка получения детальной системной информации: {e}")
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

    def serve_processes(self):
        """API для информации о процессах"""
        print("⚙️  Обрабатываю запрос информации о процессах...")
        try:
            try:
                import psutil
                
                processes = []
                for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
                    try:
                        proc_info = proc.info
                        if proc_info['cpu_percent'] is None:
                            proc_info['cpu_percent'] = 0.0
                        if proc_info['memory_percent'] is None:
                            proc_info['memory_percent'] = 0.0
                            
                        processes.append({
                            'pid': proc_info['pid'],
                            'name': proc_info['name'],
                            'cpu': round(proc_info['cpu_percent'], 1),
                            'memory': round(proc_info['memory_percent'], 1),
                            'status': proc_info['status']
                        })
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        continue
                
                # Сортируем по использованию CPU (топ 20)
                processes.sort(key=lambda x: x['cpu'], reverse=True)
                top_processes = processes[:20]
                
                print(f"⚙️  Найдено {len(processes)} процессов, показываю топ {len(top_processes)}")
                
            except ImportError:
                print("⚠️  psutil не установлен, использую тестовые данные")
                top_processes = [
                    {'pid': 1234, 'name': 'chrome', 'cpu': 15.4, 'memory': 8.2, 'status': 'running'},
                    {'pid': 5678, 'name': 'code', 'cpu': 12.1, 'memory': 6.7, 'status': 'running'},
                    {'pid': 9012, 'name': 'firefox', 'cpu': 8.9, 'memory': 12.3, 'status': 'running'},
                    {'pid': 3456, 'name': 'python3', 'cpu': 5.2, 'memory': 2.1, 'status': 'running'},
                    {'pid': 7890, 'name': 'kitty', 'cpu': 3.1, 'memory': 1.8, 'status': 'running'}
                ]
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(top_processes).encode())
            
        except Exception as e:
            print(f"❌ Ошибка получения информации о процессах: {e}")
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

    def serve_temperatures(self):
        """API для информации о температурах"""
        print("🌡️  Обрабатываю запрос температур...")
        try:
            try:
                import psutil
                
                temperatures = {}
                
                # Пытаемся получить температуры
                if hasattr(psutil, 'sensors_temperatures'):
                    temps = psutil.sensors_temperatures()
                    for name, entries in temps.items():
                        for entry in entries:
                            temp_name = f"{name}_{entry.label}" if entry.label else name
                            temperatures[temp_name] = {
                                'current': round(entry.current, 1),
                                'high': entry.high,
                                'critical': entry.critical
                            }
                
                print(f"🌡️  Температуры: {temperatures}")
                
            except ImportError:
                print("⚠️  psutil не установлен, использую тестовые данные")
                temperatures = {
                    'cpu_package': {'current': 45.0, 'high': 80.0, 'critical': 90.0},
                    'cpu_core0': {'current': 42.0, 'high': 80.0, 'critical': 90.0},
                    'cpu_core1': {'current': 44.0, 'high': 80.0, 'critical': 90.0},
                    'nvme': {'current': 38.0, 'high': 70.0, 'critical': 80.0}
                }
            except:
                # Fallback для систем без поддержки температур
                temperatures = {
                    'cpu': {'current': 45.0, 'high': 80.0, 'critical': 90.0}
                }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(temperatures).encode())
            
        except Exception as e:
            print(f"❌ Ошибка получения температур: {e}")
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

    def serve_disk_activity(self):
        """API для информации о дисковой активности"""
        print("💾 Обрабатываю запрос дисковой активности...")
        try:
            try:
                import psutil
                
                # Получаем I/O статистику дисков
                disk_io = psutil.disk_io_counters(perdisk=True)
                disk_usage = {}
                
                for device, io_stats in disk_io.items():
                    disk_usage[device] = {
                        'read_bytes': io_stats.read_bytes,
                        'write_bytes': io_stats.write_bytes,
                        'read_count': io_stats.read_count,
                        'write_count': io_stats.write_count,
                        'read_time': io_stats.read_time,
                        'write_time': io_stats.write_time
                    }
                
                # Получаем использование основных разделов
                partitions = []
                for partition in psutil.disk_partitions():
                    try:
                        usage = psutil.disk_usage(partition.mountpoint)
                        partitions.append({
                            'device': partition.device,
                            'mountpoint': partition.mountpoint,
                            'fstype': partition.fstype,
                            'total': round(usage.total / (1024**3), 2),  # GB
                            'used': round(usage.used / (1024**3), 2),   # GB
                            'free': round(usage.free / (1024**3), 2),   # GB
                            'percent': round((usage.used / usage.total) * 100, 1)
                        })
                    except PermissionError:
                        continue
                
                disk_data = {
                    'io_stats': disk_usage,
                    'partitions': partitions
                }
                
                print(f"💾 Дисковая активность: найдено {len(partitions)} разделов")
                
            except ImportError:
                print("⚠️  psutil не установлен, использую тестовые данные")
                disk_data = {
                    'io_stats': {
                        'nvme0n1': {
                            'read_bytes': 12345678901,
                            'write_bytes': 9876543210,
                            'read_count': 123456,
                            'write_count': 98765,
                            'read_time': 45678,
                            'write_time': 32109
                        }
                    },
                    'partitions': [
                        {
                            'device': '/dev/nvme0n1p2',
                            'mountpoint': '/',
                            'fstype': 'ext4',
                            'total': 238.5,
                            'used': 78.9,
                            'free': 159.6,
                            'percent': 33.1
                        }
                    ]
                }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(disk_data).encode())
            
        except Exception as e:
            print(f"❌ Ошибка получения дисковой активности: {e}")
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
    
    def serve_calendar_config(self):
        """API для конфигурации Google Calendar"""
        print("📅 Обрабатываю запрос конфигурации календаря...")
        try:
            # Пытаемся загрузить настройки из файла
            config_file = Path('calendar_config.json')
            
            if config_file.exists():
                with open(config_file, 'r') as f:
                    config = json.load(f)
                    print(f"✅ Настройки календаря загружены из {config_file}")
            else:
                # Создаем файл с примером настроек
                config = {
                    'apiKey': '',
                    'clientId': '',
                    'instructions': 'Получите API ключи в Google Cloud Console'
                }
                
                with open(config_file, 'w') as f:
                    json.dump(config, f, indent=2)
                    
                print(f"📝 Создан файл настроек: {config_file}")
                print("⚠️  Настройте API ключи для работы с Google Calendar")
            
            # Скрываем чувствительные данные если они есть
            response_config = config.copy()
            if response_config.get('apiKey'):
                response_config['apiKey'] = response_config['apiKey'][:10] + '...' if len(response_config['apiKey']) > 10 else 'set'
            if response_config.get('clientId'):
                response_config['clientId'] = response_config['clientId'][:20] + '...' if len(response_config['clientId']) > 20 else 'set'
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_config).encode())
            
        except Exception as e:
            print(f"❌ Ошибка обработки конфигурации календаря: {e}")
            # Возвращаем пустую конфигурацию чтобы фронт перешел в offline режим
            self.send_response(404)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

    def serve_docker_containers(self):
        """API для информации о Docker контейнерах (локально и на серверах)"""
        print("🐳 Обрабатываю запрос Docker контейнеров...")
        try:
            containers_data = {
                'local': self.get_local_docker_containers(),
                'servers': {
                    'got_is_tod': self.get_remote_docker_containers('got_is_tod'),
                    'azure-aluminium': self.get_remote_docker_containers('azure-aluminium')
                }
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(containers_data).encode())
            
            print(f"🐳 Docker данные отправлены")
            
        except Exception as e:
            print(f"❌ Ошибка получения Docker контейнеров: {e}")
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

    def serve_ssh_connections(self):
        """API для информации о SSH подключениях и статусе серверов"""
        print("🔐 Обрабатываю запрос SSH подключений...")
        try:
            ssh_data = {
                'local': self.get_local_ssh_connections(),     # Исправлено для соответствия клиенту
                'servers': {                                   # Исправлено для соответствия клиенту
                    'got_is_tod': self.check_server_status('got_is_tod'),
                    'azure-aluminium': self.check_server_status('azure-aluminium')
                }
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(ssh_data).encode())
            
            print(f"🔐 SSH данные отправлены")
            
        except Exception as e:
            print(f"❌ Ошибка получения SSH подключений: {e}")
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

    def get_local_docker_containers(self):
        """Получение локальных Docker контейнеров"""
        try:
            import subprocess
            result = subprocess.run(['docker', 'ps', '-a', '--format', 'json'], 
                                  capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                containers = []
                for line in result.stdout.strip().split('\n'):
                    if line:
                        container = json.loads(line)
                        containers.append({
                            'id': container.get('ID', ''),
                            'name': container.get('Names', ''),
                            'image': container.get('Image', ''),
                            'status': container.get('Status', ''),
                            'state': container.get('State', ''),
                            'ports': container.get('Ports', ''),
                            'created': container.get('CreatedAt', '')
                        })
                return containers
            else:
                print("⚠️ Docker не установлен или недоступен локально")
                return []
                
        except Exception as e:
            print(f"⚠️ Ошибка получения локальных Docker контейнеров: {e}")
            return []

    def get_remote_docker_containers(self, server_alias):
        """Получение Docker контейнеров с удаленного сервера"""
        try:
            import subprocess
            cmd = f'ssh {server_alias} "docker ps -a --format json" 2>/dev/null'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=15)
            
            if result.returncode == 0:
                containers = []
                for line in result.stdout.strip().split('\n'):
                    if line:
                        try:
                            container = json.loads(line)
                            containers.append({
                                'id': container.get('ID', ''),
                                'name': container.get('Names', ''),
                                'image': container.get('Image', ''),
                                'status': container.get('Status', ''),
                                'state': container.get('State', ''),
                                'ports': container.get('Ports', ''),
                                'created': container.get('CreatedAt', ''),
                                'server': server_alias
                            })
                        except json.JSONDecodeError:
                            continue
                return containers
            else:
                print(f"⚠️ Не удалось подключиться к {server_alias} или Docker недоступен")
                return []
                
        except Exception as e:
            print(f"⚠️ Ошибка получения Docker контейнеров с {server_alias}: {e}")
            return []

    def get_remote_server_processes(self, server_alias):
        """Получение процессов с удаленного сервера"""
        try:
            import subprocess
            # Получаем топ процессов с сервера
            cmd = f'ssh -o ConnectTimeout=5 {server_alias} "ps aux --sort=-%cpu | head -10" 2>/dev/null'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                processes = []
                lines = result.stdout.strip().split('\n')[1:]  # Пропускаем заголовок
                for i, line in enumerate(lines[:8]):  # Берем топ 8 процессов
                    if line.strip():
                        parts = line.split(None, 10)  # Разбиваем на максимум 11 частей
                        if len(parts) >= 11:
                            processes.append({
                                'protocol': f'{server_alias} Process',
                                'local_address': f"CPU: {parts[2]}%",
                                'remote_address': f"{parts[10][:50]}..." if len(parts[10]) > 50 else parts[10],
                                'status': f"MEM: {parts[3]}%"
                            })
                return processes
            else:
                return []
                
        except Exception as e:
            print(f"⚠️ Ошибка получения процессов с {server_alias}: {e}")
            return []

    def get_local_ssh_connections(self):
        """Получение процессов с удаленных серверов"""
        ssh_connections = []
        
        try:
            # Получаем процессы с каждого сервера
            servers = ['got_is_tod', 'azure-aluminium']
            
            for server in servers:
                server_processes = self.get_remote_server_processes(server)
                ssh_connections.extend(server_processes)
            
            return ssh_connections
            
        except Exception as e:
            print(f"⚠️ Ошибка получения процессов серверов: {e}")
            return []

    def check_server_status(self, server_alias):
        """Проверка статуса удаленного сервера"""
        try:
            import subprocess
            import time
            
            start_time = time.time()
            # Простая проверка подключения
            cmd = f'ssh -o ConnectTimeout=5 -o BatchMode=yes {server_alias} "echo connected" 2>/dev/null'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
            
            ping_time = round((time.time() - start_time) * 1000, 1)  # в миллисекундах
            
            if result.returncode == 0 and 'connected' in result.stdout:
                # Получаем дополнительную информацию о сервере
                uptime_cmd = f'ssh -o ConnectTimeout=3 {server_alias} "uptime; df -h / | tail -1; free -m | grep Mem" 2>/dev/null'
                uptime_result = subprocess.run(uptime_cmd, shell=True, capture_output=True, text=True, timeout=8)
                
                server_info = {'ping': ping_time}
                if uptime_result.returncode == 0:
                    lines = uptime_result.stdout.strip().split('\n')
                    if len(lines) >= 3:
                        server_info['uptime'] = lines[0].strip()
                        server_info['disk'] = lines[1].strip()
                        server_info['memory'] = lines[2].strip()
                
                return {
                    'status': 'online',
                    'ping': ping_time,
                    'info': server_info
                }
            else:
                return {
                    'status': 'offline',
                    'ping': None,
                    'error': 'Connection failed'
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'ping': None,
                'error': str(e)
            }

    def log_message(self, format, *args):
        """Красивые логи в стиле Cyberkitty"""
        print(f"🚀 [{self.log_date_time_string()}] {format % args}")

def main():
    """Запуск сервера разработки"""
    
    # Проверяем, что мы в правильной директории
    if not Path(PUBLIC_DIR).exists():
        print("❌ Папка 'public' не найдена!")
        print("   Убедитесь, что вы запускаете сервер из корня проекта")
        sys.exit(1)
    
    # Создаем сервер
    try:
        with socketserver.TCPServer((HOST, PORT), CyberkittyHTTPRequestHandler) as httpd:
            server_url = f"http://{HOST}:{PORT}"
            
            print("\n" + "="*50)
            print("🚀 CYBERKITTY DASHBOARD SERVER")
            print("="*50)
            print(f"📡 Сервер запущен: {server_url}")
            print(f"📁 Директория: {os.path.abspath(PUBLIC_DIR)}")
            print("🌐 Открываю браузер...")
            print("\n💡 Для остановки нажмите Ctrl+C")
            print("="*50 + "\n")
            
            # Браузер запускается только через лончер по запросу
            # try:
            #     webbrowser.open(server_url)
            # except Exception as e:
            #     print(f"⚠️  Не удалось открыть браузер: {e}")
            #     print(f"   Откройте вручную: {server_url}")
            print(f"   Запустите браузер через лончер: ./launch-transparent.sh")
            
            # Запускаем сервер
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n🛑 Сервер остановлен")
    except OSError as e:
        if e.errno == 98:  # Address already in use
            print(f"❌ Порт {PORT} уже занят!")
            print(f"   Попробуйте другой порт или завершите процесс на порту {PORT}")
        else:
            print(f"❌ Ошибка запуска сервера: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 