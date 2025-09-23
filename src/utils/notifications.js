/* eslint-disable no-unused-vars */
// utils/notifications.js - Sistema de notificações centralizado
import React from "react";

class NotificationManager {
  constructor() {
    this.listeners = new Set();
    this.history = [];
    this.maxHistory = 50;
  }

  // Adicionar listener para notificações
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Emitir notificação
  emit(message, type = 'info', duration = 5000, data = {}) {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: new Date(),
      duration,
      data,
    };

    // Adicionar ao histórico
    this.history.unshift(notification);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }

    // Notificar todos os listeners
    this.listeners.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Erro no listener de notificação:', error);
      }
    });

    // Auto-remover após duração especificada
    if (duration > 0) {
      setTimeout(() => this.remove(notification.id), duration);
    }

    return notification.id;
  }

  // Métodos de conveniência
  success(message, data = {}) {
    return this.emit(message, 'success', 4000, data);
  }

  error(message, data = {}) {
    return this.emit(message, 'error', 7000, data);
  }

  info(message, data = {}) {
    return this.emit(message, 'info', 5000, data);
  }

  warning(message, data = {}) {
    return this.emit(message, 'warning', 6000, data);
  }

  loading(message, data = {}) {
    return this.emit(message, 'loading', 0, data); // Não auto-remove
  }

  // Remover notificação específica
  remove(id) {
    this.listeners.forEach(callback => {
      try {
        callback({ type: 'remove', id });
      } catch (error) {
        console.error('Erro ao remover notificação:', error);
      }
    });
  }

  // Limpar todas as notificações
  clear() {
    this.listeners.forEach(callback => {
      try {
        callback({ type: 'clear' });
      } catch (error) {
        console.error('Erro ao limpar notificações:', error);
      }
    });
  }

  // Obter histórico de notificações
  getHistory() {
    return [...this.history];
  }
}

// Instância global
export const notifications = new NotificationManager();

// Hook React para usar notificações
export const useNotifications = () => {
  const [activeNotifications, setActiveNotifications] = React.useState([]);

  React.useEffect(() => {
    const unsubscribe = notifications.addListener((notification) => {
      if (notification.type === 'remove') {
        setActiveNotifications(prev => 
          prev.filter(n => n.id !== notification.id)
        );
      } else if (notification.type === 'clear') {
        setActiveNotifications([]);
      } else {
        setActiveNotifications(prev => [notification, ...prev.slice(0, 4)]); // Max 5 notificações simultâneas
      }
    });

    return unsubscribe;
  }, []);

  const removeNotification = (id) => {
    notifications.remove(id);
  };

  return {
    notifications: activeNotifications,
    removeNotification,
    success: notifications.success.bind(notifications),
    error: notifications.error.bind(notifications),
    info: notifications.info.bind(notifications),
    warning: notifications.warning.bind(notifications),
    loading: notifications.loading.bind(notifications),
    clear: notifications.clear.bind(notifications),
  };
};

// Logger melhorado que substitui console.log
class Logger {
  constructor() {
    this.enabled = import.meta.env.DEV;
    this.levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
  }

  log(level, message, data = {}) {
    if (!this.enabled && level !== 'ERROR') return;

    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...data
    };

    // Console output em desenvolvimento
    if (this.enabled) {
      const style = this.getLogStyle(level);
      console.log(
        `%c[${timestamp}] ${level}:`,
        style,
        message,
        data.details ? data.details : ''
      );
    }

    // Enviar para sistema de monitoramento em produção
    if (!this.enabled && level === 'ERROR') {
      this.sendToMonitoring(logData);
    }

    // Mostrar notificação para erros críticos
    if (level === 'ERROR' && data.showNotification) {
      notifications.error(message, data);
    }
  }

  getLogStyle(level) {
    switch (level) {
      case 'DEBUG':
        return 'color: #6B7280; background: #F9FAFB; padding: 2px 6px; border-radius: 3px;';
      case 'INFO':
        return 'color: #2563EB; background: #DBEAFE; padding: 2px 6px; border-radius: 3px;';
      case 'WARN':
        return 'color: #D97706; background: #FEF3C7; padding: 2px 6px; border-radius: 3px;';
      case 'ERROR':
        return 'color: #DC2626; background: #FECACA; padding: 2px 6px; border-radius: 3px;';
      default:
        return '';
    }
  }

  async sendToMonitoring(logData) {
    try {
      // Integração com serviços como Sentry, LogRocket, etc.
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
    } catch (error) {
      // Falha silenciosa para não criar loop de erro
    }
  }

  debug(message, data = {}) {
    this.log('DEBUG', message, data);
  }

  info(message, data = {}) {
    this.log('INFO', message, data);
  }

  warn(message, data = {}) {
    this.log('WARN', message, data);
  }

  error(message, data = {}) {
    this.log('ERROR', message, data);
  }

  // Método para tracking de eventos importantes
  track(event, properties = {}) {
    this.info(`Event: ${event}`, { 
      type: 'analytics',
      event,
      properties,
      details: properties 
    });

    // Enviar para analytics em produção
    if (!this.enabled) {
      this.sendAnalytics(event, properties);
    }
  }

  async sendAnalytics(event, properties) {
    try {
      // Integração com Google Analytics, Mixpanel, etc.
      if (window.gtag) {
        window.gtag('event', event, properties);
      }
    } catch (error) {
      // Falha silenciosa
    }
  }
}

// Instância global do logger
export const logger = new Logger();

// Substituir console.log globalmente em produção
if (!import.meta.env.DEV) {
  const originalConsole = { ...console };
  
  console.log = (...args) => logger.debug(args.join(' '));
  console.info = (...args) => logger.info(args.join(' '));
  console.warn = (...args) => logger.warn(args.join(' '));
  console.error = (...args) => logger.error(args.join(' '), { showNotification: true });
  
  // Manter acesso ao console original se necessário
  window.originalConsole = originalConsole;
}

// Utilitários de performance
export const performance = {
  mark: (name) => {
    if (window.performance && window.performance.mark) {
      window.performance.mark(name);
      logger.debug(`Performance mark: ${name}`);
    }
  },

  measure: (name, startMark, endMark) => {
    if (window.performance && window.performance.measure) {
      try {
        window.performance.measure(name, startMark, endMark);
        const measures = window.performance.getEntriesByName(name);
        const duration = measures[measures.length - 1]?.duration || 0;
        
        logger.info(`Performance measure: ${name}`, {
          type: 'performance',
          duration: Math.round(duration * 100) / 100,
          details: { duration, startMark, endMark }
        });

        // Alertar sobre operações lentas
        if (duration > 1000) {
          logger.warn(`Slow operation detected: ${name} took ${duration}ms`);
        }

        return duration;
      } catch (error) {
        logger.error('Performance measurement failed', { 
          details: { name, startMark, endMark, error } 
        });
      }
    }
    return 0;
  },

  time: (label) => {
    const startTime = Date.now();
    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.info(`Timer: ${label}`, {
        type: 'timing',
        duration,
        details: { duration, label }
      });
      return duration;
    };
  }
};

// Interceptador de erros globais
window.addEventListener('error', (event) => {
  logger.error('Global JavaScript Error', {
    type: 'global_error',
    showNotification: true,
    details: {
      message: event.error?.message || event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    }
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled Promise Rejection', {
    type: 'promise_rejection',
    showNotification: true,
    details: {
      reason: event.reason?.message || event.reason,
      stack: event.reason?.stack
    }
  });
});

// Utilitário para debugging condicional
export const debug = {
  enabled: import.meta.env.DEV,
  
  log: (...args) => {
    if (debug.enabled) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  table: (data) => {
    if (debug.enabled && console.table) {
      console.table(data);
    }
  },
  
  group: (label) => {
    if (debug.enabled && console.group) {
      console.group(label);
    }
  },
  
  groupEnd: () => {
    if (debug.enabled && console.groupEnd) {
      console.groupEnd();
    }
  },
  
  time: (label) => {
    if (debug.enabled && console.time) {
      console.time(label);
    }
  },
  
  timeEnd: (label) => {
    if (debug.enabled && console.timeEnd) {
      console.timeEnd(label);
    }
  }
};