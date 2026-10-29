# ==============================================================================
# ServiCore Frontend - Production Dockerfile (Vite SPA + Nginx)
# ==============================================================================

# Estágio 1: Build da aplicação React
FROM node:20-alpine AS builder
WORKDIR /app

# Instala dependências
COPY package.json package-lock.json ./
RUN npm ci

# Copia código-fonte e compila para produção
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Estágio 2: Nginx leve para entrega de ativos estáticos
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Remove arquivos padrão do Nginx
RUN rm -rf ./*

# Copia build estático e configuração com fallback para SPA
COPY --from=builder /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
