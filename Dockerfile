FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM deps AS build

WORKDIR /app

COPY . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV WEIXIN_PROXY_TARGET=http://host.docker.internal:8080

COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY server.ts ./
COPY tsconfig.json ./
COPY vite.config.ts ./

EXPOSE 3000

CMD ["npm", "run", "start"]
