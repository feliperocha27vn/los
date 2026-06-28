FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY web/package.json ./web/
RUN pnpm install --frozen-lockfile --filter ./web...

FROM base AS web-build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json pnpm-lock.yaml ./
COPY web/package.json ./web/
COPY web/tsconfig*.json ./web/
COPY web/vite.config.ts ./web/
COPY web/index.html ./web/
COPY web/public ./web/public
COPY web/src ./web/src
RUN pnpm install --frozen-lockfile
WORKDIR /app/web
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE
RUN pnpm build

FROM nginx:1.27-alpine AS web
COPY --from=web-build /app/web/dist /usr/share/nginx/html
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
  listen 80;
  listen [::]:80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  gzip on;
  gzip_vary on;
  gzip_min_length 1024;
  gzip_proxied any;
  gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss application/atom+xml image/svg+xml;

  location /api/ {
    proxy_pass http://api:3333/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400;
    client_max_body_size 50m;
  }

  location /docs {
    proxy_pass http://api:3333/docs;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }

  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
EOF
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
