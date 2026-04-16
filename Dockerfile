# escape=`
FROM node:22-windowsservercore-ltsc2022 AS deps

WORKDIR C:\app

COPY package*.json ./
RUN npm ci

FROM deps AS build

WORKDIR C:\app

COPY . .
RUN npm run build

FROM node:22-windowsservercore-ltsc2022 AS runner

WORKDIR C:\app

ENV NODE_ENV=production
ENV APP_ENV=test
ENV WEIXIN_PROXY_TARGET=http://host.docker.internal:8080

COPY package*.json ./
COPY --from=deps C:/app/node_modules ./node_modules
COPY --from=build C:/app/dist ./dist
COPY server.ts ./
COPY tsconfig.json ./
COPY vite.config.ts ./

EXPOSE 3000

CMD ["npm", "run", "start"]
