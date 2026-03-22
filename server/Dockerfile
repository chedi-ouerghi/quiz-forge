# Base stage
FROM node:20-alpine AS base

# Installer les dépendances pnpm (ou utiliser npm)
RUN npm install -g npm@latest

WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package*.json ./
RUN npm ci

# Build stage
FROM dependencies AS build
COPY . .
RUN npm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production

# Créer un utilisateur non-root pour plus de sécurité
RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp
WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

USER nodeapp

EXPOSE 3001

CMD ["node", "dist/index.ts"]
