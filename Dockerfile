# --- ETAPA 1: Construcción ---
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Definimos la URL de la API para que el front sepa dónde conectar
ENV PUBLIC_API_URL=https://api.temucomasajes.cl
RUN npm run build

# --- ETAPA 2: Servidor ---
# Si usas salida estática, usamos Nginx (más rápido en la Pi)
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
# Configuración básica para manejar rutas de Astro (SPA/Routing)
RUN printf 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
