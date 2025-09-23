/* eslint-disable no-unused-vars */
import React from 'react';
import { motion } from 'framer-motion';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log do erro para monitoramento (em produção)
    if (import.meta.env.PROD) {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error, errorInfo) => {
    try {
      // Aqui você pode integrar com serviços como Sentry, LogRocket, etc.
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        errorId: this.state.errorId
      };
      
      // Por enquanto apenas log no console
      console.error('Error logged:', errorData);
    } catch (loggingError) {
      console.error('Falha ao logar erro:', loggingError);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
          <motion.div
            className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <span className="text-2xl">⚠️</span>
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold">Algo deu errado</h2>
                  <p className="text-red-100 text-sm">
                    Ocorreu um erro inesperado na aplicação
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-gray-600 mb-4">
                  Não se preocupe, nossa equipe foi notificada e está trabalhando para corrigir o problema.
                </p>
                
                {/* Error ID for support */}
                {this.state.errorId && (
                  <div className="p-3 bg-gray-100 rounded-lg mb-4">
                    <p className="text-xs text-gray-500 mb-1">ID do Erro (para suporte):</p>
                    <code className="text-sm font-mono text-gray-700">
                      {this.state.errorId}
                    </code>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <motion.button
                  onClick={this.handleReset}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Tentar Novamente
                </motion.button>

                <motion.button
                  onClick={this.handleReload}
                  className="w-full py-3 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Recarregar Página
                </motion.button>
              </div>

              {/* Debug info (apenas em desenvolvimento) */}
              {import.meta.env.DEV && this.state.error && (
                <motion.details 
                  className="mt-6 p-3 bg-red-50 rounded-lg border border-red-200"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <summary className="cursor-pointer text-sm font-semibold text-red-800 mb-2">
                    Detalhes Técnicos (Debug)
                  </summary>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-red-700">Erro:</p>
                      <code className="text-xs text-red-600 bg-white p-2 rounded block overflow-auto">
                        {this.state.error.toString()}
                      </code>
                    </div>
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <p className="text-xs font-semibold text-red-700">Component Stack:</p>
                        <code className="text-xs text-red-600 bg-white p-2 rounded block overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </code>
                      </div>
                    )}
                  </div>
                </motion.details>
              )}

              {/* Contact info */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  Se o problema persistir, contacte-nos:
                </p>
                <a 
                  href="mailto:suporte@cambioangola.com"
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  suporte@cambioangola.com
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;