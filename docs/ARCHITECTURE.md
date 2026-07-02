# Skilix Architecture

Skilix is a monorepo with a Django REST backend, Vite React frontend, and shared package placeholders for future cross-app types and configuration.

## Applications

- `apps/backend`: Django, Django REST Framework, PostgreSQL, Redis, Celery.
- `apps/frontend`: Vite, React 19, React Router, TypeScript, Tailwind CSS.
- `packages/shared-types`: shared TypeScript API/domain types.
- `packages/config`: shared configuration package placeholder.
- `packages/ui`: future shared UI package placeholder.

## Frontend UI Layer

The Vite frontend uses a local presentation layer in `apps/frontend/src/shared/components/ui` for reusable page headers, surfaces, buttons, status messages, and empty states.

Global theme tokens live in `apps/frontend/src/index.css`. The current MVP visual system uses a monochrome academy style with grid-paper backgrounds, sharp bordered panels, black primary actions, `Space Grotesk` display typography, and `Noto Sans Ethiopic` for major Amharic titles.

## Local Services

Docker Compose runs PostgreSQL, Redis, Django, Celery worker, Celery beat, and the Vite frontend dev server.

The Django service binds to `0.0.0.0:8000` for local container access, so the default `DJANGO_ALLOWED_HOSTS` includes `localhost`, `127.0.0.1`, `0.0.0.0`, and the internal `backend` service hostname.

When `DJANGO_DEBUG=true`, Django exposes generated OpenAPI documentation at `/api/schema/` and Swagger UI at `/api/docs/`. These routes are not registered when debug mode is disabled.

## Backend Domains

The backend is organized into domain apps: accounts, programs, cohorts, applications, learning, submissions, announcements, and dashboard.
