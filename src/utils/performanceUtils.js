/* eslint-disable no-unused-vars */
// utils/performanceUtils.js - Versão Corrigida

import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from './notifications';

// Hook para status da rede
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType };
};

// Cache simples com TTL
class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  set(key, data, ttl = 5 * 60 * 1000) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);

    this.timers.set(key, timer);
  }

  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.cache.delete(key);
  }

  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.cache.clear();
    this.timers.clear();
  }
}

export const cacheManager = new SimpleCache();

// Hook para dados em cache - VERSÃO CORRIGIDA
export const useCachedData = (key, fetchFn, dependencies = [], ttl = 5 * 60 * 1000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const abortControllerRef = useRef(null);
  const mountedRef = useRef(true);
  const isLoadingRef = useRef(false); // Prevenir múltiplas chamadas
  const initializedRef = useRef(false); // Controlar inicialização

  // Cleanup no unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Função de fetch otimizada
  const fetchData = useCallback(async (forceRefresh = false) => {
    // Prevenir múltiplas chamadas simultâneas
    if (isLoadingRef.current && !forceRefresh) {
      logger.debug(`Fetch já em andamento para: ${key}`);
      return data;
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Verificar cache primeiro (só se não for force refresh)
    if (!forceRefresh) {
      const cachedData = cacheManager.get(key);
      if (cachedData && mountedRef.current) {
        logger.debug(`Dados encontrados no cache: ${key}`);
        setData(cachedData);
        setLoading(false);
        setError(null);
        return cachedData;
      }
    }

    // Se offline, tentar usar cache ou definir erro
    if (!navigator.onLine) {
      logger.debug("Offline - tentando carregar do cache");
      const cachedData = cacheManager.get(key);
      if (cachedData && mountedRef.current) {
        setData(cachedData);
        setError(null);
      } else if (mountedRef.current) {
        setError(new Error("Sem conexão com a internet"));
      }
      if (mountedRef.current) {
        setLoading(false);
      }
      return cachedData;
    }

    // Iniciar loading apenas se montado
    if (mountedRef.current) {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
    }

    try {
      abortControllerRef.current = new AbortController();
      
      logger.debug(`Fazendo fetch: ${key}`);
      const result = await fetchFn();
      
      if (mountedRef.current && !abortControllerRef.current?.signal.aborted) {
        setData(result);
        setError(null);
        cacheManager.set(key, result, ttl);
        
        logger.info(`Dados carregados com sucesso: ${key}`, { 
          details: { size: result?.length || 'unknown' }
        });
      }

      return result;

    } catch (err) {
      if (err.name === 'AbortError') {
        logger.debug(`Fetch cancelado: ${key}`);
        return data;
      }

      if (mountedRef.current) {
        logger.error(`Erro ao carregar dados: ${key}`, { 
          details: err.message
        });

        // Em caso de erro de rede, tentar usar dados em cache
        const cachedData = cacheManager.get(key);
        if (cachedData) {
          logger.info("Usando dados em cache devido ao erro");
          setData(cachedData);
          setError(null);
        } else {
          setError(err);
        }
      }

      throw err;

    } finally {
      if (mountedRef.current) {
        isLoadingRef.current = false;
        setLoading(false);
      }
      abortControllerRef.current = null;
    }
  }, [key, fetchFn, ttl, data]);

  // Função de refetch
  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Inicialização única - SEM dependencies para evitar loops
  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    
    const initializeData = async () => {
      logger.debug(`Inicializando dados para: ${key}`);

      // Primeiro, tentar cache
      const cachedData = cacheManager.get(key);
      if (cachedData) {
        logger.debug(`Cache encontrado na inicialização: ${key}`);
        setData(cachedData);
        setError(null);
        setLoading(false);
        
        // Se online, fazer fetch em background para atualizar
        if (navigator.onLine) {
          setTimeout(() => {
            fetchData(true).catch(err => {
              logger.warn(`Background fetch falhou: ${err.message}`);
            });
          }, 100);
        }
        return;
      }

      // Se não há cache, tentar fazer fetch
      try {
        await fetchData();
      } catch (error) {
        // Erro já foi tratado no fetchData
        logger.warn(`Inicialização com erro: ${error.message}`);
      }
    };

    initializeData();
  }, [key]); // Apenas key como dependency

  // Listener para mudanças de conectividade - SIMPLIFICADO
  useEffect(() => {
    const handleOnline = () => {
      logger.info("Conexão restaurada - tentando recarregar dados");
      fetchData(true).catch(err => {
        logger.warn(`Reload após reconexão falhou: ${err.message}`);
      });
    };

    const handleOffline = () => {
      logger.info("Conexão perdida - modo offline");
      // Cancelar qualquer fetch em andamento
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Monitor de performance básico
export const performanceMonitor = {
  marks: new Map(),

  mark: (name) => {
    const timestamp = performance.now();
    performanceMonitor.marks.set(name, timestamp);
    
    if ('mark' in performance) {
      try {
        performance.mark(name);
      } catch (error) {
        // Silently fail
      }
    }
  },

  measure: (name, startMark, endMark) => {
    try {
      const startTime = performanceMonitor.marks.get(startMark);
      const endTime = performanceMonitor.marks.get(endMark);

      if (!startTime || !endTime) {
        console.warn(`Performance marks not found: ${startMark} or ${endMark}`);
        return 0;
      }

      const duration = endTime - startTime;

      if ('measure' in performance) {
        try {
          performance.measure(name, startMark, endMark);
        } catch (error) {
          // Silently fail
        }
      }

      if (duration > 2000) {
        logger.warn(`Very slow operation: ${name} took ${duration.toFixed(2)}ms`);
      }

      return duration;
    } catch (error) {
      console.error('Performance measurement failed:', error);
      return 0;
    }
  },

  clear: () => {
    performanceMonitor.marks.clear();
    
    if ('clearMarks' in performance) {
      performance.clearMarks();
    }
    if ('clearMeasures' in performance) {
      performance.clearMeasures();
    }
  }
};

// Hook para debounce
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook para detectar dispositivo
export const useDevice = () => {
  const [device, setDevice] = useState(() => {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    return width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const newDevice = width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
      setDevice(newDevice);
    };

    const handleResize = () => {
      clearTimeout(window.resizeTimeout);
      window.resizeTimeout = setTimeout(checkDevice, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(window.resizeTimeout);
    };
  }, []);

  return device;
};

// Função para medir tempo de carregamento básico
export const measureWebVitals = () => {
  if (typeof window === 'undefined' || !import.meta.env.DEV) return;

  if (window.__webVitalsMeasured) return;
  window.__webVitalsMeasured = true;

  if (window.performance && window.performance.getEntriesByType) {
    setTimeout(() => {
      const navigationEntry = window.performance.getEntriesByType('navigation')[0];
      
      if (navigationEntry && navigationEntry.loadEventEnd > 0) {
        const loadTime = navigationEntry.loadEventEnd - navigationEntry.fetchStart;
        logger.info(`Tempo de carregamento: ${Math.round(loadTime)}ms`);
      }
    }, 1000);
  }
};

// Auto-executar medição
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', measureWebVitals);
  } else {
    setTimeout(measureWebVitals, 1000);
  }
}