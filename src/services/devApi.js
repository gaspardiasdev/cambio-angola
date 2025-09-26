// src/services/devApi.js - API específica para desenvolvimento que usa proxy local

import { useState } from "react";

class DevelopmentApiService {
  constructor() {
    this.baseUrl = import.meta.env.DEV ? '' : 'https://cambio-angola-backend-production.up.railway.app';
    this.timeout = 15000;
  }

  async makeRequest(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      console.log(`DEV API: ${this.baseUrl}/api${endpoint}`);
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      };

      const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
        credentials: 'omit'
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
      } else {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `HTTP ${response.status}`;
        } catch {
          errorMessage = `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn(`DEV API Error:`, error.message);
      throw error;
    }
  }

  // Métodos específicos
  async getRates() {
    return this.makeRequest('/rates');
  }

  async login(email, password) {
    const data = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (data?.token) {
      localStorage.setItem('userSession', JSON.stringify({
        token: data.token,
        user: data.user || null
      }));
    }
    
    return data;
  }

  async register(email, password) {
    const data = await this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (data?.token) {
      localStorage.setItem('userSession', JSON.stringify({
        token: data.token,
        user: data.user || null
      }));
    }
    
    return data;
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

  async makeAuthenticatedRequest(endpoint, options = {}) {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token necessário para esta requisição');
    }

    return this.makeRequest(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
  }
}

export const devApi = new DevelopmentApiService();

// Função para testar a API em desenvolvimento
export const testDevApi = async () => {
  console.log('🧪 Testando API de desenvolvimento...');
  
  try {
    // Testar endpoint de rates
    const rates = await devApi.getRates();
    console.log('✅ Rates funcionando:', rates.length > 0 ? `${rates.length} taxas encontradas` : 'Sem dados');
    
    return {
      success: true,
      message: `API funcionando - ${rates.length} taxas encontradas`,
      data: rates
    };
  } catch (error) {
    console.error('❌ Erro na API de desenvolvimento:', error.message);
    return {
      success: false,
      message: error.message,
      data: null
    };
  }
};

// Hook para usar em desenvolvimento
export const useDevApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const call = async (apiCall) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { call, isLoading, error };
};