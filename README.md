# Skilix

Skilix is a cohort-based Learning Management System for bootcamps, academies, and training organizations.

The platform manages the student lifecycle from application to graduation: admissions, invitations, cohorts, teachers, weekly content, submissions, grading, announcements, dashboards, and progress tracking.

## Tech Stack

- Frontend: Vite, React 19, React Router, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod
- Backend: Django, Django REST Framework, Simple JWT, Celery
- Data: PostgreSQL, Redis
- Tooling: npm for the frontend app, pnpm workspace scripts, Docker Compose

## Project Structure

```txt
apps/
  backend/       Django API
  frontend/      Vite React app
packages/
  config/        Shared config placeholder
  shared-types/  Shared TypeScript domain types
  ui/            Shared UI placeholder
docs/            Architecture, API, and ERD notes
```

## Service URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api/`
- Health check: `http://localhost:8000/api/health/`
- PostgreSQL: internal Docker host `postgres:5432`
- Redis: internal Docker host `redis:6379`

## Run With Docker

Copy the environment template first:

```bash
cp .env.example .env
```

Start the full stack:

```bash
docker compose up --build
```

Start in the background:

```bash
docker compose up --build -d
```

Stop services:

```bash
docker compose down
```

View logs:

```bash
docker compose logs -f
```

## Backend Commands

Run migrations:

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

## Frontend Commands

Install frontend dependencies when running outside Docker:

```bash
npm --prefix apps/frontend ci
```

Run the frontend directly:

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

```bash
pnpm dev
pnpm dev:detached
pnpm down
pnpm logs
pnpm backend:migrate
pnpm backend:test
pnpm frontend:lint
pnpm frontend:typecheck
pnpm frontend:build
```

## Notes

- Student accounts are invitation-based after application approval.
- Students belong to exactly one active cohort.
- Role and status checks live in the backend.
- Frontend mock data is disabled by default; set `VITE_USE_MOCK_API=true` only for local frontend demos without Django.
- Development email uses console output by default.
- Development file storage uses local media by default.
