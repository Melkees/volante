# Volante — imagem de produção (Node 20+)
# Build do front em estágio próprio; runtime só com server + dist + dados de seed.
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY --from=build /app/dist ./dist
EXPOSE 3000
# seed é idempotente: repopula o store (JSON ou SQLite) a cada subida
CMD ["sh", "-c", "node server/seed.mjs && node server/index.mjs"]
