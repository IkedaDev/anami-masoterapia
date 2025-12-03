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

# --- INYECCIÓN DE VARIABLES FIREBASE ---
# 1. Definimos los argumentos que recibiremos desde GitHub Actions
ARG PUBLIC_FIREBASE_API_KEY
ARG PUBLIC_FIREBASE_AUTH_DOMAIN
ARG PUBLIC_FIREBASE_PROJECT_ID
ARG PUBLIC_FIREBASE_STORAGE_BUCKET
ARG PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG PUBLIC_FIREBASE_APP_ID

# 2. Las establecemos como variables de entorno para que 'yarn build' las vea
ENV PUBLIC_FIREBASE_API_KEY=$PUBLIC_FIREBASE_API_KEY
ENV PUBLIC_FIREBASE_AUTH_DOMAIN=$PUBLIC_FIREBASE_AUTH_DOMAIN
ENV PUBLIC_FIREBASE_PROJECT_ID=$PUBLIC_FIREBASE_PROJECT_ID
ENV PUBLIC_FIREBASE_STORAGE_BUCKET=$PUBLIC_FIREBASE_STORAGE_BUCKET
ENV PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV PUBLIC_FIREBASE_APP_ID=$PUBLIC_FIREBASE_APP_ID

# Construir el sitio estático (ahora con las variables inyectadas)
RUN yarn build

# --- Etapa 2: Servidor Web (Nginx) ---
FROM nginx:alpine AS runtime

COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]