# Alpine-only images (project requirement). Build the SPA, serve it with nginx,
# and forward /api to the backend service. The official nginx image expands
# ${VAR} in /etc/nginx/templates/*.template at container start.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# The frontend talks to its own origin (/api) via the nginx proxy, and
# VITE_SITE_URL is the public https URL used for canonical/OG/sitemap links.
ARG VITE_API_BASE_URL=/api
ARG VITE_SITE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SITE_URL=$VITE_SITE_URL
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS final

# Non-root nginx (uid 101); still Alpine. PORT = platform-assigned listen port.
ENV PORT=8080
ENV API_ORIGIN=http://localhost:5218

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 8080
