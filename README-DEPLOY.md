# 🚀 Guia de Deploy - Câmbio Angola Frontend

Este guia te ajudará a hospedar o frontend ainda hoje usando várias opções.

## 📋 Pré-requisitos

1. **Node.js 18+** instalado
2. **Git** configurado
3. **Código do backend** funcionando
4. **URL do backend** disponível

## ⚡ Deploy Rápido (5 minutos)

### Opção 1: Netlify (Recomendado)

```bash
# 1. Build do projeto
npm install
npm run build

# 2. Instalar Netlify CLI
npm install -g netlify-cli

# 3. Deploy
netlify deploy --dir=dist --prod
```

### Opção 2: Vercel

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Deploy
vercel --prod
```

### Opção 3: Surge.sh (Mais Simples)

```bash
# 1. Build
npm run build

# 2. Instalar Surge
npm install -g surge

# 3. Deploy
cd dist
surge . your-app-name.surge.sh
```

## 🔧 Configuração Necessária

### 1. Variáveis de Ambiente

Crie `.env.production`:

```env
VITE_API_URL=https://your-backend-url.com
VITE_APP_NAME=Câmbio Angola
VITE_ENVIRONMENT=production
```

### 2. Atualizar API URL

No arquivo `src/services/api.js`, certifique-se de que a URL está correta:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
```

## 🌐 Deploy por Plataforma

### Netlify (Detalhado)

1. **Via Dashboard:**
   - Vá para [netlify.com](https://netlify.com)
   - Conecte seu repositório GitHub
   - Configure:
     - Build command: `npm run build`
     - Publish directory: `dist`
     - Environment variables: `VITE_API_URL`

2. **Via CLI:**
```bash
# Build
npm run build

# Deploy
netlify init
netlify deploy --prod --dir=dist
```

3. **Configurar Redirects:**
Crie `public/_redirects`:
```
/api/* https://your-backend-url.com/api/:splat 200
/* /index.html 200
```

### Vercel

1. **Via Dashboard:**
   - Vá para [vercel.com](https://vercel.com)
   - Import do repositório
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

2. **Configurar Environment Variables:**
   - `VITE_API_URL`: `https://your-backend-url.com`

### GitHub Pages

1. **Instalar gh-pages:**
```bash
npm install --save-dev gh-pages
```

2. **Adicionar ao package.json:**
```json
{
  "homepage": "https://yourusername.github.io/cambio-angola",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. **Deploy:**
```bash
npm run deploy
```

### Firebase Hosting

1. **Instalar Firebase CLI:**
```bash
npm install -g firebase-tools
```

2. **Inicializar:**
```bash
firebase init hosting
```

3. **Configurar `firebase.json`:**
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

4. **Deploy:**
```bash
npm run build
firebase deploy
```

## 🐳 Deploy com Docker

1. **Criar Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. **Build e Run:**
```bash
docker build --build-arg VITE_API_URL=https://your-backend-url.com -t cambio-angola .
docker run -p 80:80 cambio-angola
```

## 🔍 Checklist Pré-Deploy

- [ ] Backend funcionando e acessível
- [ ] CORS configurado no backend
- [ ] URLs de API corretas
- [ ] Build sem erros (`npm run build`)
- [ ] Testes passando (`npm test`)
- [ ] Variáveis de ambiente configuradas
- [ ] HTTPS habilitado (certificado SSL)

## 🚨 Troubleshooting

### Problema: API não funciona após deploy
**Solução:**
1. Verifique se `VITE_API_URL` está correto
2. Confirme que o backend aceita requisições da URL do frontend (CORS)
3. Use HTTPS se o backend usar HTTPS

### Problema: Rotas não funcionam (404)
**Solução:**
1. Configure redirects para SPA
2. Para Netlify: arquivo `_redirects`
3. Para Apache: arquivo `.htaccess`

### Problema: Build falha
**Solução:**
```bash
# Limpar cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

## ⚡ Deploy em 2 Minutos (Método mais rápido)

```bash
# 1. Clone e configure
git clone your-repo
cd your-repo
npm install

# 2. Configure environment
echo "VITE_API_URL=https://your-backend-url.com" > .env.production

# 3. Build
npm run build

# 4. Deploy com Surge
npm install -g surge
cd dist
surge . cambio-angola-$(date +%s).surge.sh
```

## 🌍 URLs Sugeridas

Se usar Surge.sh, escolha um nome como:
- `cambio-angola.surge.sh`
- `cambio-ao.surge.sh`
- `taxas-angola.surge.sh`

## 📱 Testes Pós-Deploy

1. **Funcionalidade básica:**
   - [ ] Landing page carrega
   - [ ] Login/registo funciona
   - [ ] Taxas são carregadas
   - [ ] Navegação entre páginas

2. **Performance:**
   - [ ] Carregamento < 3 segundos
   - [ ] Funciona em mobile
   - [ ] Funciona offline (basic)

3. **SEO:**
   - [ ] Título da página correto
   - [ ] Meta descrição
   - [ ] Favicon funcionando

## 🔄 Auto-Deploy (Opcional)

### GitHub Actions
Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run build
      env:
        VITE_API_URL: ${{ secrets.VITE_API_URL }}
    - name: Deploy to Netlify
      uses: nwtgck/actions-netlify@v1.2
      with:
        publish-dir: './dist'
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 📞 Suporte

Se tiver problemas:

1. **Verifique logs:** `npm run build` para ver erros
2. **Teste localmente:** `npm run preview` após build
3. **Verifique network:** Browser DevTools > Network
4. **Backend funcionando:** Teste endpoints diretamente

---

## 🎯 Deploy Imediato - Comando Único

Para deploy super rápido via Netlify:

```bash
npx netlify-cli deploy --build --prod --dir=dist
```

**Tempo estimado:** 2-5 minutos do zero à produção!

---

*Última atualização: Dezembro 2024*