# ============================================================================
# BioPlatform Frontend Web (Next.js 14) — production multi-stage Dockerfile
# Build context: ./src/Bio.Frontend.Web
# NEXT_PUBLIC_* vars are inlined at BUILD time → passed as build args.
# ============================================================================

# ── Dependencies ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Build ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public env (compiled into the bundle). Names MUST match what the app reads.
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_AI_API_BASE_URL
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ARG NEXT_PUBLIC_TAX_RATE
ARG NEXT_PUBLIC_SHIPPING_COST_COP
ARG NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_AI_API_BASE_URL=$NEXT_PUBLIC_AI_API_BASE_URL \
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME \
    NEXT_PUBLIC_TAX_RATE=$NEXT_PUBLIC_TAX_RATE \
    NEXT_PUBLIC_SHIPPING_COST_COP=$NEXT_PUBLIC_SHIPPING_COST_COP \
    NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD=$NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "run", "start"]
