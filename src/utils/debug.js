// utils/debug.js - Utilitários para debug da API

export class ApiDebugger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
    this.enabled = import.meta.env.DEV || localStorage.getItem('debug-api') === 'true';
  }

  log(type, message, data = null) {
    if (!this.enabled) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    };

    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    const emoji = this.getEmoji(type);
    console.log(`${emoji} [API-DEBUG] ${message}`, data || '');
  }

  getEmoji(type) {
    const emojis = {
      'request': '🔄',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️',
      'timeout': '⏰',
      'retry': '🔁'
    };
    return emojis[type] || '📝';
  }

  getLogs() {
    return this.logs;
  }

  exportLogs() {
    const blob = new Blob([JSON.stringify(this.logs, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-debug-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  clear() {
    this.logs = [];
    console.clear();
    this.log('info', 'Debug logs cleared');
  }

  // Testar conectividade com todos os endpoints
  async testConnectivity() {
    const endpoints = [
      'https://cambio-angola-backend-production.up.railway.app',
      'http://localhost:5000'
    ];

    this.log('info', 'Iniciando teste de conectividade...');

    const results = [];
    
    for (const endpoint of endpoints) {
      const startTime = performance.now();
      
      try {
        this.log('request', `Testando ${endpoint}`);
        
        const response = await fetch(`${endpoint}/api/health`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          signal: AbortSignal.timeout(5000)
        });

        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);

        if (response.ok) {
          const data = await response.json();
          results.push({
            endpoint,
            status: 'online',
            latency: `${latency}ms`,
            data
          });
          this.log('success', `${endpoint} online (${latency}ms)`, data);
        } else {
          results.push({
            endpoint,
            status: 'error',
            statusCode: response.status,
            latency: `${latency}ms`
          });
          this.log('error', `${endpoint} retornou ${response.status}`);
        }
      } catch (error) {
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);
        
        results.push({
          endpoint,
          status: 'offline',
          error: error.message,
          latency: `${latency}ms`
        });
        this.log('error', `${endpoint} falhou: ${error.message}`);
      }
    }

    return results;
  }

  // Monitor contínuo de health check
  startHealthMonitor(interval = 60000) {
    this.log('info', `Iniciando monitor de health check (${interval}ms)`);
    
    const monitor = async () => {
      try {
        const results = await this.testConnectivity();
        const online = results.filter(r => r.status === 'online');
        
        if (online.length === 0) {
          this.log('warning', 'Nenhum endpoint está online!');
        } else {
          this.log('success', `${online.length}/${results.length} endpoints online`);
        }
      } catch (error) {
        this.log('error', 'Erro no monitor de health check', error.message);
      }
    };

    // Executar imediatamente
    monitor();
    
    // Configurar intervalo
    const intervalId = setInterval(monitor, interval);
    
    return () => {
      clearInterval(intervalId);
      this.log('info', 'Monitor de health check parado');
    };
  }

  // Interceptar e logar todas as chamadas fetch
  interceptFetch() {
    const originalFetch = window.fetch;
    const debugger1 = this;
    
    window.fetch = async function(...args) {
      const [url, options = {}] = args;
      const startTime = performance.now();
      
      debugger1.log('request', `${options.method || 'GET'} ${url}`, {
        headers: options.headers,
        body: options.body
      });
      
      try {
        const response = await originalFetch.apply(this, args);
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);
        
        if (response.ok) {
          debugger1.log('success', `${response.status} ${url} (${latency}ms)`);
        } else {
          debugger1.log('error', `${response.status} ${url} (${latency}ms)`);
        }
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);
        
        debugger1.log('error', `FETCH_ERROR ${url} (${latency}ms)`, error.message);
        throw error;
      }
    };
    
    this.log('info', 'Fetch interceptor ativado');
  }
}

// Instância global
export const apiDebugger = new ApiDebugger();

// Utilitários para console
if (typeof window !== 'undefined') {
  // Funções globais para debug no console
  window.debugApi = {
    enable: () => {
      localStorage.setItem('debug-api', 'true');
      apiDebugger.enabled = true;
      console.log('✅ Debug da API ativado');
    },
    
    disable: () => {
      localStorage.removeItem('debug-api');
      apiDebugger.enabled = false;
      console.log('❌ Debug da API desativado');
    },
    
    logs: () => apiDebugger.getLogs(),
    
    export: () => apiDebugger.exportLogs(),
    
    clear: () => apiDebugger.clear(),
    
    test: () => apiDebugger.testConnectivity(),
    
    monitor: (interval) => apiDebugger.startHealthMonitor(interval),
    
    intercept: () => apiDebugger.interceptFetch()
  };

  // Mostrar instruções no console
  if (apiDebugger.enabled) {
    console.log(`
🐛 Debug da API está ativo!

Comandos disponíveis:
• debugApi.test() - Testar conectividade
• debugApi.logs() - Ver logs
• debugApi.export() - Exportar logs
• debugApi.clear() - Limpar logs
• debugApi.monitor() - Monitor contínuo
• debugApi.intercept() - Interceptar fetch
• debugApi.disable() - Desativar debug

Para ativar: debugApi.enable()
    `);
  }
}