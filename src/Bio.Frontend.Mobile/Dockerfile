# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copia package files
COPY package*.json ./

# Instala dependencias
RUN npm ci

# Copia código fuente
COPY . .

# Build de Next.js
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copia package.json para production
COPY package*.json ./

# Instala solo dependencias de producción
RUN npm ci --only=production

# Copia artefactos de build
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "run", "start"]
