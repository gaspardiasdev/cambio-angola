/* eslint-disable no-unused-vars */
// scripts/test-api.js
import https from 'https';
import http from 'http';

const endpoints = [
  'https://cambio-angola-backend-production.up.railway.app',
  'http://localhost:5000'
];

async function testEndpoint(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https:') ? https : http;
    const startTime = Date.now();
    
    const req = lib.get(`${url}/api/health`, { 
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'API-Test-Script/1.0'
      }
    }, (res) => {
      const latency = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            url,
            status: 'online',
            statusCode: res.statusCode,
            latency: `${latency}ms`,
            data: parsed
          });
        } catch (error) {
          resolve({
            url,
            status: 'error',
            statusCode: res.statusCode,
            latency: `${latency}ms`,
            error: 'Invalid JSON response'
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        url,
        status: 'offline',
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 'timeout',
        error: 'Request timeout'
      });
    });
  });
}

async function testAllEndpoints() {
  console.log('🔍 Testando endpoints da API...\n');
  
  const results = await Promise.all(endpoints.map(testEndpoint));
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.url}`);
    console.log(`   Status: ${getStatusEmoji(result.status)} ${result.status.toUpperCase()}`);
    
    if (result.statusCode) {
      console.log(`   HTTP Status: ${result.statusCode}`);
    }
    
    if (result.latency) {
      console.log(`   Latência: ${result.latency}`);
    }
    
    if (result.error) {
      console.log(`   Erro: ${result.error}`);
    }
    
    if (result.data) {
      console.log(`   Dados: ${JSON.stringify(result.data, null, 2)}`);
    }
    
    console.log('');
  });

  const onlineEndpoints = results.filter(r => r.status === 'online');
  const fastestEndpoint = onlineEndpoints.sort((a, b) => 
    parseInt(a.latency) - parseInt(b.latency)
  )[0];

  if (fastestEndpoint) {
    console.log(`🚀 Endpoint mais rápido: ${fastestEndpoint.url} (${fastestEndpoint.latency})`);
  } else {
    console.log('❌ Nenhum endpoint está funcionando!');
  }
}

function getStatusEmoji(status) {
  switch (status) {
    case 'online': return '✅';
    case 'offline': return '❌';
    case 'timeout': return '⏰';
    case 'error': return '🔶';
    default: return '❓';
  }
}

// Executar teste
if (require.main === module) {
  testAllEndpoints().catch(console.error);
}

export default { testEndpoint, testAllEndpoints };