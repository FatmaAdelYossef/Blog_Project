# Deployment runbook (PaaS)

The system ships as **two Alpine-only container images** (project requirement):

| Image | Base (Alpine) | Non-root | Health endpoint |
| --- | --- | --- | --- |
| API | `mcr.microsoft.com/dotnet/aspnet:8.0-alpine` | runs as `app` (uid 1654) | `GET /health` (checks real DB connectivity) |
| Frontend | `nginxinc/nginx-unprivileged:1.27-alpine` | runs as uid 101 | `GET /healthz` |

The frontend container serves the built SPA and **proxies `/api/*` to the API**, so both can
be exposed as one origin behind the platform's TLS terminator.

## Platform setup

Create two services (any PaaS: Railway / Render / Fly / Cloud Run) plus a managed PostgreSQL:

1. **API service** — root context `BlogBack/`; Dockerfile: `BlogBack/Dockerfile`.
2. **Frontend service** — root context `BlogFront/`; Dockerfile: `BlogFront/Dockerfile`
   (build args below), then attach it to the public domain.
3. **Database** — managed PostgreSQL 17 (or the `db` service from `docker-compose.yml` for local).

### API environment

| Variable | Value | Notes |
| --- | --- | --- |
| `PORT` | *(auto by platform)* | Entrypoint binds `http://0.0.0.0:$PORT`. |
| `ConnectionStrings__Connection1` | managed PG connection string | |
| `Jwt__Key` | random ≥ 256-bit hex | Keep out of the repo. The API refuses to boot without it. |
| `Jwt__Issuer` / `Jwt__Audience` | `BlogApi` / `BlogUser` | Defaults. |
| `Jwt__ExpireDays` | `1` | Access-token lifetime; the SPA refreshes silently. |
| `Jwt__RefreshTokenExpireDays` | `30` | Refresh-token lifetime; rotates on every use. |
| `DataProtection__KeyPath` | *(optional)* | Persistent key-ring dir, e.g. a mounted volume. Only needed for multi-instance deploys (Identity reset tokens). |
| `Frontend__Origin` | `https://<public-domain>` | CORS + reset-password link base. Leave until the domain exists. |
| `ForwardedHeaders__Enabled` | `true` | The platform terminates TLS in front of the app. |
| `Seed__DefaultPassword` | *(set only for a fresh install)* | Seeded admin users. Must be ≥ 12 chars with digit/upper/lower. Remove afterwards. |
| `EmailSettings__*` | *(deferred)* | SMTP is intentionally unconfigured; forgot-password answers "Email sending is not configured". |

### Frontend build args

| Arg | Value |
| --- | --- |
| `VITE_API_BASE_URL` | `/api` (same origin via the nginx proxy) |
| `VITE_SITE_URL` | `https://<public-domain>` (canonical/OG prefix; can be set when the domain lands) |

### SEO endpoints

`GET /robots.txt` and `GET /sitemap.xml` are served by the API and proxied through the frontend
container root (`nginx/default.conf.template`). Both derive absolute URLs from `Frontend:Origin`,
so setting that value makes the SEO endpoints, canonical tags, and reset links agree with the
public domain. Auth and account pages carry `noindex` in the rendered head.

### Frontend runtime env

| Variable | Value |
| --- | --- |
| `PORT` | *(auto by platform)* |
| `API_ORIGIN` | internal URL of the API service, e.g. `http://blog-api.localhost:8080` |

## Local production-like check

```bash
export POSTGRES_PASSWORD=$(openssl rand -hex 16)
export JWT_KEY=$(openssl rand -hex 64)
docker compose up --build -d
# web on :8081, api on :5219
```

Then verify (`docker compose ps` should show `(healthy)` for all three services):

```bash
curl http://localhost:5219/health                                   # API + DB
curl http://localhost:8081/healthz                                  # nginx
curl http://localhost:8081/api/Posts?pageNumber=1                   # proxy
curl -o /dev/null -w '%{http_code}\n' http://localhost:8081/posts/1 # SPA fallback
curl http://localhost:8081/robots.txt                               # crawl rules
curl http://localhost:8081/sitemap.xml                              # SEO urls
```

## When the domain arrives

- Set `Frontend__Origin` and `VITE_SITE_URL` to the final `https://` URL, redeploy both services.
- HSTS is enabled by the API whenever the environment is not Development; the platform's TLS
  terminator handles the certificate.
- Full SEO (canonical/OG/sitemap) reads the public URL from the above two settings.

## Notes

- ASP.NET DataProtection keys protect Identity reset/change tokens. By default they live under
  `/home/app/.aspnet/DataProtection-Keys` inside the API container and are lost on redeploy —
  outstanding reset emails then fail. For a single instance this is acceptable; for zero-downtime
  or multi-instance deploys set `DataProtection__KeyPath` to a mounted volume.
- **Uploaded images are stored on the container filesystem** (`wwwroot/images`) and do not
  survive redeploys or scale horizontally. For production durability, either attach a persistent
  volume (single instance) or move uploads to object storage — track this before launch.
- The startup `MigrationService` runs pending EF migrations and seeders before the server accepts
  traffic, so a fresh database self-initializes.
- Rate limits: auth endpoints 5 req/min per IP; image uploads 20 req/min per user.
- All images are Alpine; do not replace them with non-Alpine bases when updating versions.
