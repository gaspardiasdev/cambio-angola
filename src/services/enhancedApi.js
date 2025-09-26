import { healthCheck } from './healthCheck.js';

class EnhancedApiService {
  constructor() {
    // Em desenvolvimento, desabilitar health checks para evitar spam CORS
    if (import.meta.env.DEV) {
      console.log('Desenvolvimento: health checks desabilitados');
    } else {
      healthCheck.startPeriodicCheck();
    }
  }

  async makeRequest(endpoint, options = {}, requireAuth = true) {
    const maxRetries = 3;
    let attempt = 0;
    let lastError;

    while (attempt < maxRetries) {
      try {
        // Em desenvolvimento, sempre usar Railway diretamente
        const baseUrl = 'https://cambio-angola-backend-production.up.railway.app';
        
        // Headers sem cache-control para evitar CORS
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

        console.log(`Tentativa ${attempt + 1}: ${baseUrl}/api${endpoint}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(`${baseUrl}/api${endpoint}`, {
          ...options,
          headers,
          signal: controller.signal,
          mode: 'cors',
          credentials: 'omit'
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log('Sucesso na requisição');
            return data;
          } else if (contentType && contentType.includes('text')) {
            const text = await response.text();
            return { message: text };
          }
          
          return response;
        }

        // Tratamento de erros específicos
        if (response.status === 401) {
          this.handleAuthError();
          throw new Error('Sessão expirada. Faça login novamente.');
        }

        if (response.status === 404) {
          throw new Error('Serviço temporariamente indisponível');
        }

        // Tentar obter mensagem de erro
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `Erro HTTP ${response.status}` };
        }
        
        throw new Error(errorData.message || `Erro ${response.status}`);

      } catch (error) {
        lastError = error;
        attempt++;

        console.warn(`Erro na tentativa ${attempt}: ${error.message}`);

        // Não fazer retry em alguns casos
        if (error.message.includes('Sessão expirada') || 
            error.message.includes('Token de autenticação')) {
          break;
        }

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-expired', {
        detail: { message: 'Sessão expirada' }
      }));
    }
  }

  async googleAuth(credential, clientId) {
    console.log('Iniciando autenticação Google...');
    const result = await this.makeRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential, clientId })
    }, false);
    
    if (result?.token) {
      localStorage.setItem('userSession', JSON.stringify({
        token: result.token,
        user: result.user || null
      }));
    }
    
    return result;
  }

  async login(email, password) {
    console.log('Fazendo login...');
    const result = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }, false);
    
    if (result?.token) {
      localStorage.setItem('userSession', JSON.stringify({
        token: result.token,
        user: result.user || null
      }));
    }
    
    return result;
  }

  async register(email, password) {
    console.log('Registrando usuário...');
    const result = await this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }, false);
    
    if (result?.token) {
      localStorage.setItem('userSession', JSON.stringify({
        token: result.token,
        user: result.user || null
      }));
    }
    
    return result;
  }

  async getRates() {
    console.log('Buscando taxas...');
    return this.makeRequest('/rates', {}, false);
  }

  async validateSession() {
    console.log('Validando sessão...');
    return this.makeRequest('/auth/validate', { method: 'POST' });
  }

  async createAlert(alertData) {
    console.log('Criando alerta...');
    return this.makeRequest('/alerts', {
      method: 'POST',
      body: JSON.stringify(alertData)
    });
  }

  async getUserAlerts() {
    console.log('Buscando alertas do usuário...');
    return this.makeRequest('/alerts');
  }
}

export const enhancedApi = new EnhancedApiService();