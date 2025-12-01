# --- Etapa 1: Construcción (Builder) ---
FROM node:20-alpine AS builder

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json yarn.lock ./

# Instalar dependencias
# Usamos ci (clean install) para entornos de construcción
RUN yarn install --frozen-lockfile

# Copiar el resto del código fuente
COPY . .

# Construir el sitio estático (genera la carpeta /dist)
RUN yarn build

# --- Etapa 2: Servidor Web (Nginx) ---
FROM nginx:alpine AS runtime

# Copiar los archivos estáticos generados en la etapa anterior
# a la carpeta donde Nginx sirve contenido
COPY --from=builder /app/dist /usr/share/nginx/html

# (Opcional) Copiar una configuración personalizada de Nginx si fuera necesaria
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

# Comando por defecto para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]