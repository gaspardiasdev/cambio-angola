// services/errorRecovery.js - Serviço para recuperação automática de erros

import { useEffect, useState } from "react";

export class ErrorRecoveryService {
  constructor() {
    this.failureCount = new Map(); // endpoint -> count
    this.lastSuccess = new Map(); // endpoint -> timestamp
    this.circuitBreakers = new Map(); // endpoint -> state
    this.retryQueues = new Map(); // endpoint -> queue[]
    
    this.config = {
      maxFailures: 5,
      circuitBreakerTimeout: 30000, // 30s
      retryDelays: [1000, 2000, 4000, 8000], // Exponential backoff
      maxRetries: 3
    };
  }

  // Registrar falha em endpoint
  recordFailure(endpoint, error) {
    const count = this.failureCount.get(endpoint) || 0;
    this.failureCount.set(endpoint, count + 1);
    
    console.warn(`⚠️ Falha #${count + 1} em ${endpoint}: ${error.message}`);
    
    // Abrir circuit breaker se muitas falhas
    if (count + 1 >= this.config.maxFailures) {
      this.openCircuitBreaker(endpoint);
    }
  }

  // Registrar sucesso em endpoint
  recordSuccess(endpoint) {
    this.failureCount.set(endpoint, 0);
    this.lastSuccess.set(endpoint, Date.now());
    this.closeCircuitBreaker(endpoint);
    
    console.log(`✅ Sucesso registrado para ${endpoint}`);
  }

  // Abrir circuit breaker
  openCircuitBreaker(endpoint) {
    this.circuitBreakers.set(endpoint, {
      state: 'open',
      openedAt: Date.now()
    });
    
    console.error(`🔴 Circuit breaker ABERTO para ${endpoint}`);
    
    // Auto-recuperação após timeout
    setTimeout(() => {
      this.halfOpenCircuitBreaker(endpoint);
    }, this.config.circuitBreakerTimeout);
  }

  // Meio-abrir circuit breaker (permitir teste)
  halfOpenCircuitBreaker(endpoint) {
    if (this.circuitBreakers.get(endpoint)?.state === 'open') {
      this.circuitBreakers.set(endpoint, {
        state: 'half-open',
        halfOpenedAt: Date.now()
      });
      
      console.log(`🟡 Circuit breaker MEIO-ABERTO para ${endpoint} - testando...`);
    }
  }

  // Fechar circuit breaker (totalmente funcional)
  closeCircuitBreaker(endpoint) {
    this.circuitBreakers.set(endpoint, {
      state: 'closed',
      closedAt: Date.now()
    });
    
    console.log(`🟢 Circuit breaker FECHADO para ${endpoint}`);
  }

  // Verificar se endpoint está disponível
  isEndpointAvailable(endpoint) {
    const breaker = this.circuitBreakers.get(endpoint);
    
    if (!breaker || breaker.state === 'closed') {
      return true;
    }
    
    if (breaker.state === 'open') {
      const timeSinceOpen = Date.now() - breaker.openedAt;
      return timeSinceOpen >= this.config.circuitBreakerTimeout;
    }
    
    // half-open permite tentativas limitadas
    return breaker.state === 'half-open';
  }

  // Executar requisição com recuperação automática
  async executeWithRecovery(endpoint, requestFn, options = {}) {
    const maxRetries = options.maxRetries || this.config.maxRetries;
    let attempt = 0;
    let lastError;

    while (attempt <= maxRetries) {
      try {
        // Verificar circuit breaker
        if (!this.isEndpointAvailable(endpoint)) {
          throw new Error(`Circuit breaker ativo para ${endpoint}`);
        }

        console.log(`🔄 Tentativa ${attempt + 1}/${maxRetries + 1} para ${endpoint}`);
        
        const result = await requestFn();
        
        // Sucesso - registrar e retornar
        this.recordSuccess(endpoint);
        return result;
        
      } catch (error) {
        lastError = error;
        this.recordFailure(endpoint, error);
        
        attempt++;
        
        // Se não é a última tentativa, aguardar antes de retry
        if (attempt <= maxRetries) {
          const delay = this.getRetryDelay(attempt);
          console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
          await this.sleep(delay);
        }
      }
    }

    // Todas as tentativas falharam
    throw new Error(`Falha após ${maxRetries + 1} tentativas: ${lastError?.message}`);
  }

  // Calcular delay para retry (exponential backoff com jitter)
  getRetryDelay(attempt) {
    const baseDelay = this.config.retryDelays[Math.min(attempt - 1, this.config.retryDelays.length - 1)];
    const jitter = Math.random() * 1000; // Adicionar variação aleatória
    return baseDelay + jitter;
  }

  // Utilitário para sleep
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Obter estatísticas de saúde dos endpoints
  getHealthStats() {
    const stats = {};
    
    const allEndpoints = new Set([
      ...this.failureCount.keys(),
      ...this.lastSuccess.keys(),
      ...this.circuitBreakers.keys()
    ]);
    
    for (const endpoint of allEndpoints) {
      stats[endpoint] = {
        failures: this.failureCount.get(endpoint) || 0,
        lastSuccess: this.lastSuccess.get(endpoint),
        circuitBreaker: this.circuitBreakers.get(endpoint)?.state || 'closed',
        available: this.isEndpointAvailable(endpoint)
      };
    }
    
    return stats;
  }

  // Reset completo
  reset() {
    this.failureCount.clear();
    this.lastSuccess.clear();
    this.circuitBreakers.clear();
    this.retryQueues.clear();
    
    console.log('🔄 Error Recovery Service resetado');
  }

  // Configurar parâmetros
  configure(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Error Recovery Service reconfigurado:', this.config);
  }
}

// Instância global
export const errorRecovery = new ErrorRecoveryService();

// Wrapper para requisições com recuperação automática
export const makeResilientRequest = async (endpoint, requestFn, options = {}) => {
  return errorRecovery.executeWithRecovery(endpoint, requestFn, options);
};

// Hook para React (se necessário)
export const useErrorRecovery = () => {
  const [stats, setStats] = useState(errorRecovery.getHealthStats());
  
  useEffect(() => {
    const updateStats = () => {
      setStats(errorRecovery.getHealthStats());
    };
    
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);
  
  return {
    stats,
    reset: () => errorRecovery.reset(),
    configure: (config) => errorRecovery.configure(config)
  };
};

// Exemplo de uso no enhanced API
/*
import { makeResilientRequest } from './errorRecovery.js';

async makeRequest(endpoint, options = {}, requireAuth = true) {
  return makeResilientRequest(
    'https://cambio-angola-backend-production.up.railway.app',
    async () => {
      // Lógica original da requisição aqui
      const response = await fetch(`${baseUrl}/api${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return response.json();
    },
    { maxRetries: 2 }
  );
}
*/