FROM node:20-alpine AS base
WORKDIR /app

# Dependencies
FROM base AS deps
RUN apk add --no-co-cache libc6-compat
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
ENV PORT=3000

CMD ["sh", "-c", "npx prisma db push && npx prisma db seed && npm run start"]
