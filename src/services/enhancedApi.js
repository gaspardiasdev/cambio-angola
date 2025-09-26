import { healthCheck } from './healthCheck.js';

class EnhancedApiService {
  constructor() {
    this.retryQueue = [];
    this.isProcessingQueue = false;
    
    // Iniciar health checks
    if (typeof window !== 'undefined') {
      healthCheck.startPeriodicCheck();
    }
  }

  async makeRequest(endpoint, options = {}, requireAuth = true) {
    const maxRetries = 3;
    let attempt = 0;
    let lastError;

    while (attempt < maxRetries) {
      try {
        const baseUrl = await healthCheck.findBestEndpoint();
        
        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        };

        if (requireAuth) {
          const token = this.getToken();
          if (!token) {
            throw new Error('Token de autenticação necessário');
          }
          headers['Authorization'] = `Bearer ${token}`;
        }

        console.log(`Tentativa ${attempt + 1}: ${baseUrl}${endpoint}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(`${baseUrl}/api${endpoint}`, {
          ...options,
          headers,
          signal: controller.signal,
          credentials: 'include'
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            return await response.json();
          } else if (contentType && contentType.includes('text')) {
            return { message: await response.text() };
          }
          
          return response;
        }

        // Status codes específicos
        if (response.status === 401) {
          this.handleAuthError();
          throw new Error('Sessão expirada. Faça login novamente.');
        }

        if (response.status === 429) {
          const delay = 2000 * Math.pow(2, attempt);
          console.log(`Rate limited, aguardando ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          throw new Error('Muitas tentativas, aguarde um momento');
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro HTTP ${response.status}`);

      } catch (error) {
        lastError = error;
        attempt++;

        if (error.name === 'AbortError') {
          console.warn(`Timeout na tentativa ${attempt}`);
        } else if (error.message.includes('fetch')) {
          console.warn(`Erro de rede na tentativa ${attempt}: ${error.message}`);
        } else {
          console.warn(`Erro na tentativa ${attempt}: ${error.message}`);
        }

        if (attempt < maxRetries) {
          const delay = 1000 * Math.pow(2, attempt - 1);
          console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Falha após ${maxRetries} tentativas: ${lastError?.message}`);
  }

  getToken() {
    try {
      const session = localStorage.getItem('userSession');
      if (!session) return null;
      const parsed = JSON.parse(session);
      return parsed?.token || null;
    } catch {
      return null;
    }
  }

  handleAuthError() {
    localStorage.removeItem('userSession');
    window.dispatchEvent(new CustomEvent('auth-expired'));
  }

  // Método específico para Google Auth
  async googleAuth(credential, clientId) {
    return this.makeRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential, clientId })
    }, false);
  }

  async login(email, password) {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }, false);
  }

  async register(email, password) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }, false);
  }

  async getRates() {
    return this.makeRequest('/rates', {}, false);
  }
}

export const enhancedApi = new EnhancedApiService();
