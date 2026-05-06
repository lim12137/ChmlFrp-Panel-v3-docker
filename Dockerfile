FROM node:20-alpine AS builder

WORKDIR /app

ARG PNPM_REGISTRY=https://registry.npmjs.org/
RUN npm install -g pnpm@10.11.0 --registry=${PNPM_REGISTRY}

COPY package.json pnpm-lock.yaml ./
RUN pnpm config set registry ${PNPM_REGISTRY}
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:1.27-alpine

RUN apk add --no-cache gettext

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY docker/40-config.sh /docker-entrypoint.d/40-config.sh
COPY --from=builder /app/dist /usr/share/nginx/html

RUN chmod +x /docker-entrypoint.d/40-config.sh

ENV APP_API_BASE_URL=https://cf-v2.uapis.cn
ENV APP_PANEL_ORIGIN=https://panel.chmlfrp.net
ENV APP_SITE_ORIGIN=https://www.chmlfrp.net

EXPOSE 80
