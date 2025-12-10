# --- Etapa 1: Construcción (Builder) ---
FROM node:20-alpine AS builder

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json yarn.lock ./

# Instalar dependencias
RUN yarn install --frozen-lockfile

# Copiar el resto del código fuente
COPY . .

# 💥 NUEVA VARIABLE: URL DEL BACKEND
ARG PUBLIC_API_URL

ENV PUBLIC_API_URL=$PUBLIC_API_URL

# Construir el sitio estático (ahora con las variables inyectadas)
RUN yarn build

# --- Etapa 2: Servidor Web (Nginx) ---
FROM nginx:alpine AS runtime

COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]