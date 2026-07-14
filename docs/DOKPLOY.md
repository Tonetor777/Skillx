# Dokploy Deployment

Skilix supports an all-in-one Dokploy deployment with Docker Compose.

This deployment runs:

- Frontend static app on `frontend:80`
- Django API on `backend:8000`
- One-shot Django migrations through `backend-migrate`
- Celery worker and Celery beat
- PostgreSQL
- Redis
- MinIO for private media storage

The local `docker-compose.yml` remains for development. Use `docker-compose.dokploy.yml` in Dokploy.

## Dokploy App Setup

1. Create a new Dokploy Docker Compose app from this repository.
2. Set the compose file path to `docker-compose.dokploy.yml`.
3. Add environment variables in Dokploy's Environment tab.
4. Configure domains:
   - `app.example.com` routes to service `frontend`, port `80`.
   - `api.example.com` routes to service `backend`, port `8000`.
5. Enable backups for Docker named volumes, especially `postgres_data` and `minio_data`.
6. Deploy.

Dokploy writes UI environment variables into a `.env` file beside the compose file. The production compose file uses `env_file: .env` so every app container receives the same runtime configuration.

## GitHub Actions CI/CD

The repository includes `.github/workflows/dokploy-ci-cd.yml` for Dokploy validation and deployment.

- Pull requests targeting `main` run frontend checks, Docker image builds, Dokploy Compose validation, backend tests, Django checks, and Django deploy checks.
- Pushes to `main` run the same checks, then call the Dokploy deploy webhook.
- Manual runs through `workflow_dispatch` run the checks and then call the same webhook.

Configure these GitHub settings before relying on automated deployment:

```bash
DOKPLOY_DEPLOY_WEBHOOK_URL=<dokploy-deploy-webhook-url>
VITE_API_URL=https://api.example.com/api
```

Store `DOKPLOY_DEPLOY_WEBHOOK_URL` as a GitHub repository secret. Store `VITE_API_URL` as a GitHub repository variable so the CI frontend build matches the production API target. If the variable is missing, CI falls back to `https://api.example.com/api` for validation only.

Keep runtime secrets such as `DJANGO_SECRET_KEY`, database credentials, MinIO credentials, and `RESEND_API_KEY` in Dokploy. GitHub Actions only validates the images and triggers Dokploy; Dokploy remains the production runtime source of truth.

## Required Environment

Replace example domains and secrets before deploying.

```bash
DJANGO_DEBUG=false
DJANGO_SECRET_KEY=<strong 50+ character secret>
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

## First Deploy Checks

After deployment:

1. Open `https://api.example.com/api/health/`.
2. Open `https://app.example.com`.
3. Sign in with a seeded or created admin account.
4. Submit and approve an application.
5. Confirm an invitation email is sent through Resend.
6. Upload a profile/program image and confirm signed media URLs work.
7. Grade a submission and confirm the grade email is sent.
8. Confirm Celery worker and beat containers stay running.

## Local Validation

Run these before pushing a production deployment change:

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

## Rollback

Use Dokploy's deployment history to redeploy the previous version. Keep database migrations backward-compatible during MVP releases so the previous application image can run against the current database schema.

Restore Postgres or MinIO data from Dokploy volume backups only when an application rollback is not enough.
