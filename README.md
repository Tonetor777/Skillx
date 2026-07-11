# Skilix

Skilix is a cohort-based Learning Management System for bootcamps, academies, and training organizations.

The platform manages the student lifecycle from application to graduation: admissions, invitations, cohorts, teachers, weekly content, submissions, grading, announcements, dashboards, and progress tracking.

## Tech Stack

- Frontend: Vite, React 19, React Router, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod
- Backend: Django, Django REST Framework, Simple JWT, Celery
- Data: PostgreSQL, Redis, MinIO / S3-compatible media storage
- Tooling: npm for the frontend app, pnpm workspace scripts, Docker Compose

## Project Structure

```txt
apps/
  backend/              Django API, Celery app, domain apps, migrations, tests
  frontend/             Vite React app, dashboard UI, production Nginx config
packages/
  config/               Shared config placeholder
  shared-types/         Shared TypeScript domain types
  ui/                   Shared UI placeholder
docs/                   Architecture, API, ERD, user flows, deployment runbooks
docker-compose.yml      Local development stack
docker-compose.dokploy.yml
                        Production Dokploy stack
Dockerfile.backend      Production backend image for Dokploy/Railway
railway.json            Railway backend deployment config
```

## Service URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api/`
- Health check: `http://localhost:8000/api/health/`
- API docs: `http://localhost:8000/api/docs/`
- OpenAPI schema: `http://localhost:8000/api/schema/`
- PostgreSQL: internal Docker host `postgres:5432`
- Redis: internal Docker host `redis:6379`
- MinIO API: `http://localhost:9000`

## Local Development

Docker Compose is the default local runtime. It starts the frontend, Django API, PostgreSQL, Redis, MinIO, Celery worker, and Celery beat.

### 1. Create Local Environment

Copy the environment template first:

```bash
cp .env.example .env
```

The default `.env.example` values are intended for local development. Do not use the example secrets in production.

### 2. Start the Full Stack

Start the full stack:

```bash
docker compose up --build
```

Start in the background:

```bash
docker compose up --build -d
```

The local compose file runs `backend-migrate` automatically before the backend starts, so a fresh database is migrated during startup.

### 3. Open the App

After the containers are healthy, open:

- Frontend: `http://localhost:3000`
- Backend health check: `http://localhost:8000/api/health/`
- Development API docs: `http://localhost:8000/api/docs/`

Seed sample data if needed:

```bash
docker compose run --rm backend python manage.py seed_development_data
```

Create an admin user if you need a fresh account:

```bash
docker compose run --rm backend python manage.py createsuperuser
```

### 4. Stop or Inspect Services

Stop services:

```bash
docker compose down
```

View logs:

```bash
docker compose logs -f
```

Rebuild images after dependency or Dockerfile changes:

```bash
docker compose build
```

## Local Backend Commands

Run a manual migration when needed:

```bash
docker compose run --rm backend python manage.py migrate
```

Seed local development data:

```bash
docker compose run --rm backend python manage.py seed_development_data
```

Create a superuser:

```bash
docker compose run --rm backend python manage.py createsuperuser
```

Run backend tests:

```bash
docker compose run --rm backend pytest
```

Run Django system checks:

```bash
docker compose run --rm backend python manage.py check
```

Open a Django shell:

```bash
docker compose run --rm backend python manage.py shell
```

## Local Frontend Commands

The frontend can run through Docker with the full stack, or directly on the host when you only need Vite.

Install frontend dependencies for host-based frontend work:

```bash
npm --prefix apps/frontend ci
```

Run the frontend directly against the local Django API:

```bash
npm --prefix apps/frontend run dev
```

Validate the frontend:

```bash
npm --prefix apps/frontend run lint
npm --prefix apps/frontend run typecheck
npm --prefix apps/frontend run test
npm --prefix apps/frontend run build
```

## Useful Root Scripts

The root package exposes shortcuts for common Docker and frontend tasks:

```bash
pnpm dev
pnpm dev:detached
pnpm down
pnpm logs
pnpm backend:migrate
pnpm backend:test
pnpm backend:createsuperuser
pnpm frontend:dev
pnpm frontend:lint
pnpm frontend:typecheck
pnpm frontend:build
```

## Production Deployment

The primary production target is Dokploy with `docker-compose.dokploy.yml`. It runs the frontend static container, Django API, one-shot migrations, Celery worker, Celery beat, PostgreSQL, Redis, and MinIO in one compose app.

See [docs/DOKPLOY.md](docs/DOKPLOY.md) for the full runbook.

### Dokploy

1. Create a Dokploy Docker Compose app from this repository.
2. Set the compose file path to `docker-compose.dokploy.yml`.
3. Add production environment variables in Dokploy.
4. Configure the frontend and API domains.
5. Deploy.

Configure domains:

- `app.example.com` routes to service `frontend` on port `80`.
- `api.example.com` routes to service `backend` on port `8000`.

Enable backups for the named volumes that hold durable data:

- `postgres_data`
- `redis_data`
- `minio_data`

Required production variables:

```bash
DJANGO_DEBUG=false
DJANGO_SECRET_KEY=<strong unique 50+ character secret>
DJANGO_ALLOWED_HOSTS=api.example.com,backend
DJANGO_CSRF_TRUSTED_ORIGINS=https://app.example.com,https://api.example.com
DJANGO_CORS_ALLOWED_ORIGINS=https://app.example.com
DJANGO_SECURE_SSL_REDIRECT=true
DJANGO_SECURE_HSTS_SECONDS=31536000
DJANGO_SECURE_HSTS_PRELOAD=true
DJANGO_SESSION_COOKIE_SECURE=true
DJANGO_CSRF_COOKIE_SECURE=true
DATABASE_URL=postgresql://skilix:<strong-db-password>@postgres:5432/skilix
POSTGRES_DB=skilix
POSTGRES_USER=skilix
POSTGRES_PASSWORD=<strong-db-password>
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/1
MINIO_ROOT_USER=<strong-minio-user>
MINIO_ROOT_PASSWORD=<strong-minio-password>
MINIO_BUCKET=skilix-media
AWS_ACCESS_KEY_ID=<strong-minio-user>
AWS_SECRET_ACCESS_KEY=<strong-minio-password>
AWS_STORAGE_BUCKET_NAME=skilix-media
AWS_S3_ENDPOINT_URL=http://minio:9000
AWS_S3_REGION_NAME=us-east-1
AWS_S3_ADDRESSING_STYLE=path
AWS_QUERYSTRING_AUTH=true
AWS_QUERYSTRING_EXPIRE=3600
RESEND_API_KEY=<resend-api-key>
DEFAULT_FROM_EMAIL=<verified-sender>
FRONTEND_URL=https://app.example.com
VITE_API_URL=https://api.example.com/api
VITE_USE_MOCK_API=false
```

The production compose stack uses:

- `Dockerfile.backend` for Django, Celery, and migrations.
- `apps/frontend/Dockerfile.prod` for the Vite static build.
- `apps/frontend/nginx.conf` for SPA routing.
- `backend-migrate` as a one-shot migration service before the API starts.

### Railway / Vercel Alternative

The repository also keeps `railway.json` and `Dockerfile.backend` for a Railway backend plus Vercel frontend deployment. For that path:

- Deploy the backend from the repository root with `Dockerfile.backend`.
- Configure Railway to use the health check path `/api/health/`.
- Set the backend production environment variables from `.env.example`.
- Deploy the Vite frontend separately and set `VITE_API_URL` to the production API URL ending in `/api`.

Use the Dokploy docs as the source of truth when deploying the all-in-one stack.

### Release Checks

Before promoting a release:

```bash
docker compose -f docker-compose.dokploy.yml config --quiet
docker build -f Dockerfile.backend .
docker build -f apps/frontend/Dockerfile.prod --build-arg VITE_API_URL=https://api.example.com/api apps/frontend
docker compose -f docker-compose.dokploy.yml run --rm backend pytest
docker compose -f docker-compose.dokploy.yml run --rm backend python manage.py check
docker compose -f docker-compose.dokploy.yml run --rm -e DJANGO_DEBUG=false -e DJANGO_SECRET_KEY=production-secret-key-with-more-than-fifty-unique-safe-chars-123 -e DJANGO_ALLOWED_HOSTS=api.example.com,backend -e DJANGO_CSRF_TRUSTED_ORIGINS=https://app.example.com,https://api.example.com -e DJANGO_CORS_ALLOWED_ORIGINS=https://app.example.com -e DJANGO_SECURE_SSL_REDIRECT=true -e DJANGO_SECURE_HSTS_SECONDS=31536000 -e DJANGO_SECURE_HSTS_PRELOAD=true backend python manage.py check --deploy
npm --prefix apps/frontend run typecheck
npm --prefix apps/frontend run test
npm --prefix apps/frontend run build
```

After deploy, confirm `https://api.example.com/api/health/` returns `{"status":"ok","service":"skilix-api"}` and smoke test login, application approval, invitations, uploads, dashboards, and grading.

Rollback by redeploying the previous Dokploy deployment. Database migrations should remain backward-compatible during MVP releases.

## Notes

- Student accounts are invitation-based after application approval.
- Students belong to exactly one active cohort.
- Role and status checks live in the backend.
- Frontend mock data is disabled by default; set `VITE_USE_MOCK_API=true` only for local frontend demos without Django.
- Development email uses console output by default.
- Development file storage uses local media unless S3-compatible storage variables are configured.
- Local Docker includes MinIO so private media storage can be tested without an external S3 provider.
