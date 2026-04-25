# --- Etapa 1: Construcción (Builder) ---
FROM node:20-alpine AS builder
WORKDIR /app

# Copiamos los archivos de dependencias primero para aprovechar el caché
COPY package.json yarn.lock ./
# Instalamos usando yarn para evitar conflictos de lockfile
RUN yarn install --frozen-lockfile

# Copiamos el resto del código
COPY . .

# Variables de entorno para el Build (inyectadas desde GitHub Actions)
ARG PUBLIC_API_URL
ENV PUBLIC_API_URL=$PUBLIC_API_URL

ARG PUBLIC_GA_ID
ENV PUBLIC_GA_ID=$PUBLIC_GA_ID

# Construir el sitio estático
RUN yarn build

# --- Etapa 2: Servidor (Nginx) ---
FROM nginx:alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
# Configuración para que el routing de Astro funcione bien
RUN printf 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
