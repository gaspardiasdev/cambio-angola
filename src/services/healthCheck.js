class HealthCheckService {
  constructor() {
    this.endpoints = [
      'https://cambio-angola-backend-production.up.railway.app',
      // Remover localhost em produção para evitar conflitos
      ...(import.meta.env.DEV ? ['http://localhost:5000'] : [])
    ];
    this.currentEndpoint = null;
    this.lastCheck = null;
    this.isChecking = false;
  }

  async checkEndpoint(url, timeout = 8000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        mode: 'cors'
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return { 
          url, 
          status: 'online', 
          latency: Date.now() - this.lastCheck,
          data 
        };
      }
      
      return { url, status: 'error', error: `HTTP ${response.status}` };
    } catch (error) {
      clearTimeout(timeoutId);
      return { 
        url, 
        status: 'offline', 
        error: error.name === 'AbortError' ? 'timeout' : error.message 
      };
    }
  }

  async findBestEndpoint() {
    if (this.isChecking) return this.currentEndpoint;
    
    this.isChecking = true;
    this.lastCheck = Date.now();

    try {
      const checks = await Promise.allSettled(
        this.endpoints.map(url => this.checkEndpoint(url))
      );

      const online = checks
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
        .filter(check => check.status === 'online')
        .sort((a, b) => a.latency - b.latency);

      if (online.length > 0) {
        this.currentEndpoint = online[0].url;
        console.log(`✅ Melhor endpoint: ${this.currentEndpoint} (${online[0].latency}ms)`);
      } else {
        console.warn('⚠️ Nenhum endpoint disponível, usando fallback');
        this.currentEndpoint = this.endpoints[0];
      }

      return this.currentEndpoint;
    } finally {
      this.isChecking = false;
    }
  }

  getCurrentEndpoint() {
    return this.currentEndpoint || this.endpoints[0];
  }

  // Executar check a cada 60 segundos para reduzir overhead
  startPeriodicCheck() {
    this.findBestEndpoint(); // Check inicial
    setInterval(() => this.findBestEndpoint(), 60000);
  }
}

export const healthCheck = new HealthCheckService();