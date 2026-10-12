# Build i runtime strony Omnira Rewards (Next standalone). Kontekst = ten katalog.
# Prościej niż w Control Tower, bo to nie są workspaces: jeden package.json,
# jeden lockfile, standalone ląduje w .next/standalone/server.js.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Bez `COPY /app/public`: to demo nie ma katalogu `public`. Favicon i znak
# strony żyją w `src/app/` (konwencja App Routera), a `public` z samym plikiem
# .gitkeep byłby katalogiem utrzymywanym tylko po to, żeby Dockerfile miał co
# skopiować. Wchodzi z powrotem, gdy pojawi się pierwszy plik statyczny.

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
