# Changelog

All notable changes to Skilix are documented here.

This project follows a modified version of Keep a Changelog.

---

# Unreleased

## Added

- JWT refresh-token logout, email verification, and password reset API workflows with Vite frontend routes.
- Program archive/detail support and validated cohort current-week/status management.
- Public application submission with resume/payment proof validation and expiring invitation accept/resend/revoke workflows.
- Teacher assignment API and dashboard controls with role validation and removal support.
- Week CRUD, publish workflow, ordered resource API, and weekly content dashboard view.
- Grade email notifications, scheduled announcement visibility, leaderboard API, and role-specific dashboard summaries.
- User flow documentation for application, invitation, learning, grading, and dashboard workflows.
- Development-only OpenAPI schema and Swagger UI endpoints for the Django REST API.
- DRF API endpoints for frontend dashboard integration across authentication, programs, cohorts, applications, assignments, submissions, announcements, and platform settings.
- Assignment and platform settings persistence, assignment-based submissions, and deterministic local development seed data.
- Monorepo package setup with pnpm workspace configuration.
- Docker Compose development stack for frontend, backend, PostgreSQL, Redis, Celery worker, and Celery beat.
- Development Dockerfiles for Vite and Django, plus a production Dockerfile for Django.
- Django backend scaffold with REST framework, Simple JWT, Celery, PostgreSQL, and domain apps.
- Initial database models and migrations for users, programs, cohorts, applications, invitations, weekly content, resources, submissions, and announcements.
- Vite React frontend scaffold with login and role dashboard shells.
- Architecture, API, and ERD foundation documentation.
- Root README with project description and run commands.

## Changed

- Refreshed the Vite frontend with a monochrome academy theme, grid-paper backgrounds, sharp bordered surfaces, reusable UI helpers, and Amharic major titles.
- Vite frontend now uses the Django API by default and only uses the mock database when `VITE_USE_MOCK_API=true`.
- Documented common development commands and service URLs in `AGENTS.md`.
- Updated frontend Docker, environment, scripts, and documentation from Next.js assumptions to the current Vite React app.

## Fixed

- Django local development now accepts requests using the `0.0.0.0:8000` host header.
- Docker Compose now applies Django migrations before backend startup, preventing JWT token issuance from failing when Simple JWT blacklist tables are missing.

## Removed

-

---

# v0.1.0 - MVP Initialization

Date:

## Added

- Initial repository
- PRD
- AI development structure
- AGENTS.md
- Documentation structure
- Folder architecture

---

# Change Entry Template

## Added

New functionality.

## Changed

Behavior changed.

## Fixed

Bug fixes.

## Removed

Deleted functionality.

## Deprecated

Will be removed later.

## Security

Security improvements.

## Performance

Performance improvements.

## Documentation

Documentation updates.
