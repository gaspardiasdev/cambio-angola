// utils/corsDebug.js - Ferramenta para diagnosticar e resolver problemas de CORS

class CORSDebugger {
  constructor() {
    this.testResults = [];
    this.endpoints = [
      'https://cambio-angola-backend-production.up.railway.app',
      'http://localhost:5000'
    ];
  }

  // Testar diferentes configurações de headers para encontrar a que funciona
  async testCORSConfigurations() {
    console.log('Iniciando testes de configuração CORS...');
    
    const headerConfigurations = [
      {
        name: 'Minimal Headers',
        headers: {
          'Accept': 'application/json'
        }
      },
      {
        name: 'Standard Headers',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      },
      {
        name: 'With Cache Control',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      },
      {
        name: 'Simple Request (GET only)',
        headers: {}
      }
    ];

    const results = {};

    for (const endpoint of this.endpoints) {
      results[endpoint] = {};
      
      for (const config of headerConfigurations) {
        try {
          console.log(`Testando ${config.name} em ${endpoint}...`);
          
          const response = await fetch(`${endpoint}/api/rates`, {
            method: 'GET',
            headers: config.headers,
            mode: 'cors',
            credentials: 'omit'
          });

          if (response.ok) {
            const data = await response.json();
            results[endpoint][config.name] = {
              status: 'SUCCESS',
              data: data?.length || 0,
              responseHeaders: Array.from(response.headers.entries())
            };
            console.log(`✅ ${config.name} funcionou!`);
          } else {
            results[endpoint][config.name] = {
              status: 'HTTP_ERROR',
              statusCode: response.status,
              statusText: response.statusText
            };
            console.warn(`⚠️ ${config.name}: HTTP ${response.status}`);
          }
        } catch (error) {
          results[endpoint][config.name] = {
            status: 'CORS_ERROR',
            error: error.message
          };
          console.error(`❌ ${config.name}: ${error.message}`);
        }
      }
    }

    this.testResults = results;
    return results;
  }

  // Detectar configuração CORS do servidor
  async detectServerCORS(url) {
    try {
      console.log(`Detectando configuração CORS de ${url}...`);
      
      // Fazer uma requisição OPTIONS para ver os headers CORS
      const response = await fetch(`${url}/api/rates`, {
        method: 'OPTIONS'
      });

      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials'),
        'Access-Control-Max-Age': response.headers.get('Access-Control-Max-Age')
      };

      console.log('Configuração CORS detectada:', corsHeaders);
      return corsHeaders;
    } catch (error) {
      console.error(`Erro ao detectar CORS de ${url}:`, error.message);
      return null;
    }
  }

  // Gerar função de API otimizada baseada nos testes
  generateOptimizedApiFunction(testResults) {
    // Encontrar a configuração que funciona melhor
    let bestConfig = null;
    let bestEndpoint = null;

    for (const [endpoint, configs] of Object.entries(testResults)) {
      for (const [configName, result] of Object.entries(configs)) {
        if (result.status === 'SUCCESS') {
          bestConfig = configName;
          bestEndpoint = endpoint;
          break;
        }
      }
      if (bestConfig) break;
    }

    if (!bestConfig) {
      return 'Nenhuma configuração funcionou. Considere usar proxy no vite.config.js';
    }

    const headerConfigs = {
      'Minimal Headers': { 'Accept': 'application/json' },
      'Standard Headers': { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      'With Cache Control': { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      'Simple Request (GET only)': {}
    };

    const optimalHeaders = headerConfigs[bestConfig];

    return `
// Função API otimizada baseada nos testes CORS
export const optimizedApiFetch = async (endpoint, options = {}) => {
  const baseUrl = '${bestEndpoint}';
  
  const response = await fetch(\`\${baseUrl}/api\${endpoint}\`, {
    method: 'GET',
    headers: ${JSON.stringify(optimalHeaders, null, 6)},
    mode: 'cors',
    credentials: 'omit',
    ...options
  });
  
  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
  }
  
  return response.json();
};

// Usar assim:
// const rates = await optimizedApiFetch('/rates');
`;
  }

  // Executar diagnóstico completo
  async runFullDiagnosis() {
    console.log('🔍 Executando diagnóstico completo de CORS...');
    
    // 1. Testar configurações
    const testResults = await this.testCORSConfigurations();
    
    // 2. Detectar configuração do servidor
    const corsConfigs = {};
    for (const endpoint of this.endpoints) {
      corsConfigs[endpoint] = await this.detectServerCORS(endpoint);
    }
    
    // 3. Gerar código otimizado
    const optimizedCode = this.generateOptimizedApiFunction(testResults);
    
    const diagnosis = {
      testResults,
      corsConfigs,
      optimizedCode,
      recommendations: this.generateRecommendations(testResults, corsConfigs)
    };

    console.log('📊 Diagnóstico completo:', diagnosis);
    return diagnosis;
  }

  generateRecommendations(testResults, corsConfigs) {
    const recommendations = [];
    
    // Verificar se alguma configuração funcionou
    const hasWorking = Object.values(testResults).some(endpoint =>
      Object.values(endpoint).some(config => config.status === 'SUCCESS')
    );

    if (!hasWorking) {
      recommendations.push({
        type: 'CRITICAL',
        message: 'Nenhuma configuração de headers funcionou. Use proxy no Vite.',
        solution: 'Ativar proxy no vite.config.js para desenvolvimento'
      });
    }

    // Verificar headers permitidos
    for (const [endpoint, corsConfig] of Object.entries(corsConfigs)) {
      if (corsConfig && corsConfig['Access-Control-Allow-Headers']) {
        const allowedHeaders = corsConfig['Access-Control-Allow-Headers'].toLowerCase();
        if (!allowedHeaders.includes('cache-control')) {
          recommendations.push({
            type: 'WARNING',
            message: `${endpoint} não permite header Cache-Control`,
            solution: 'Remover Cache-Control em desenvolvimento ou usar proxy'
          });
        }
      }
    }

    return recommendations;
  }

  // Exportar resultados para análise
  exportResults() {
    const data = {
      timestamp: new Date().toISOString(),
      testResults: this.testResults,
      userAgent: navigator.userAgent,
      origin: window.location.origin
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cors-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Instância global
export const corsDebugger = new CORSDebugger();

// Função de conveniência para usar no console
if (typeof window !== 'undefined') {
  window.debugCORS = {
    test: () => corsDebugger.testCORSConfigurations(),
    diagnose: () => corsDebugger.runFullDiagnosis(),
    export: () => corsDebugger.exportResults()
  };
  
  console.log(`
🔧 CORS Debugger carregado!

Comandos disponíveis:
• debugCORS.test() - Testar configurações de headers
• debugCORS.diagnose() - Diagnóstico completo  
• debugCORS.export() - Exportar resultados

Para resolver CORS rapidamente, execute:
debugCORS.diagnose()
  `);
}