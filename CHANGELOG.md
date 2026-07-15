# Changelog

All notable changes to Skilix are documented here.

This project follows a modified version of Keep a Changelog.

---

# Unreleased

## Added

- Reinvite action for approved admissions applications so Admin/Super Admin users can send a fresh invitation link after the previous link expires.
- Gmail SMTP email delivery configuration using a Gmail app password, with Docker Compose environment wiring for backend, migration, Celery, and beat services.
- Cohort selection during admissions approval so Admin/Super Admin reviewers choose the exact cohort before sending an invitation.
- Empty-record hard delete actions for programs and cohorts, with safeguards that block deletion when dependent records exist.
- Per-user in-app announcement notifications with unread counts, dashboard badges, and mark-read actions.
- Assignment edit controls and delete-or-lock management: staff can delete empty assignments, while submitted assignments are preserved and locked against further student submissions.
- Public `/signup` route for student signup requests, with `/apply` redirected for compatibility.
- Public active-program catalog endpoint for unauthenticated signup program selection.
- Lesson image upload API and inline image rendering for TipTap lesson content.
- YouTube link detection that appends safe iframe embeds to rendered lesson content.
- Cohort-date attendance tracking with bulk roster status recording.
- Cohort assignment/attendance grade weights and weighted student total grade summaries.
- Railway production deployment config with a root backend Dockerfile, migration predeploy command, Gunicorn start command, and `/api/health/` health check.
- Dokploy all-in-one production compose stack with frontend, backend, migrations, Celery, PostgreSQL, Redis, MinIO, named volumes, and separate frontend/API domain support.
- GitHub Actions CI/CD for validating the Dokploy stack and triggering Dokploy deployments from the `main` branch.
- Production frontend Dockerfile and Nginx SPA config for serving the Vite build in Dokploy.
- Dokploy deployment runbook covering environment variables, domains, health checks, backups, smoke tests, and rollback.
- Production-ready Django settings for strong runtime secrets, HTTPS redirects, secure cookies, HSTS, proxy SSL headers, env-driven CORS/CSRF origins, and DRF request throttling.
- Resend-compatible Django email backend for production email delivery while retaining console email for local development.
- Production readiness tests for secure settings and Resend payload delivery.
- Native TipTap lesson editor for teacher-authored structured lessons, plus safe inline student rendering with plain-text fallback for existing content.
- MinIO-backed private media storage support with signed URL responses for profile photos and program thumbnails.
- JWT refresh-token logout, email verification, and password reset API workflows with Vite frontend routes.
- Program archive/detail support and validated cohort current-week/status management.
- Public application submission without document uploads, plus expiring invitation accept/resend/revoke workflows.
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

- Django email settings now prefer SMTP when SMTP credentials are configured, while keeping Resend available as an alternate backend.
- Student signup applications now collect age, choice-based experience level, and program expectations, and no longer collect country.
- Admissions review is available to Admin and Super Admin users, and approval now requires an eligible cohort in the applicant's selected program.
- Student overview assignment cards now show status-aware actions such as Submit, Resubmit, View Grade, View Submission, or Closed.
- Redesigned curriculum management into a reference-style two-pane layout with a left module/lesson navigator and right lesson reading canvas for Modules and embedded Program curriculum views.
- Graded submissions now stay locked for student edits while allowing authorized staff to update score and feedback.
- Student signup approval sends an invitation email for password setup instead of creating a login-ready account immediately.
- Student program API access is now scoped to the program attached to the student's enrolled cohort.
- Lesson content now stores uploaded image asset ids instead of expiring media URLs.
- Expanded the root README with current local Docker guidance, MinIO service details, automatic migration behavior, root scripts, and Dokploy/Railway/Vercel deployment guidance.
- Vite route pages are now lazy-loaded to reduce initial production bundle size.
- README and `.env.example` now document Railway/Vercel production environment variables, migrations, health checks, release checks, and rollback basics.
- Lessons now treat `content` as first-class in-app learning material, while resources remain ordered supporting links and attachments.
- Reimplemented cohort learning delivery as Program → Cohort → Module → Lesson → Resource → Assignment, with module/lesson APIs and dashboard updates.
- Added teacher/elevated-role curriculum CRUD controls and student dropdown navigation for weeks, modules, lessons, and resources.
- Embedded live cohort curriculum management inside Program detail so staff manage the curriculum students see from the program page.
- Refactored curriculum management into nested week, module, lesson, and resource panels with contextual add/edit/delete controls.
- Refreshed the Vite frontend with a monochrome academy theme, grid-paper backgrounds, sharp bordered surfaces, reusable UI helpers, and Amharic major titles.
- Vite frontend now uses the Django API by default and only uses the mock database when `VITE_USE_MOCK_API=true`.
- Documented common development commands and service URLs in `AGENTS.md`.
- Updated frontend Docker, environment, scripts, and documentation from Next.js assumptions to the current Vite React app.

## Fixed

- Docker Compose backend services now receive email provider environment variables from `.env`, allowing invitation emails to use the configured email backend in local Docker.
- Local Docker backend, migration, and Celery services now receive explicit `DJANGO_DEBUG` and `DJANGO_SECRET_KEY` compose values so host shell settings cannot accidentally trigger production secret validation during development.
- OpenAPI schema generation now has safer view/queryset handling and clearer serializer method field typing.
- Removed frontend API-client debug console output from production-facing request paths.
- Add Week now opens a visible new-week module form before the week has saved modules.
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
