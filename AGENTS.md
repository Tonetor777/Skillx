# AGENTS.md

# Skilix AI Development Guide

This file is the primary source of truth for AI coding agents working on the Skilix project.

Read this document before making any code changes.

---

# Project Overview

**Project Name:** Skilix

**Type:** Cohort-Based Learning Management System (LMS)

**Stage:** MVP

Skilix is a modern learning management system designed for bootcamps, academies, and training organizations.

It manages the complete student lifecycle from application through graduation.

The platform is centered around Programs and Cohorts instead of standalone courses.

---

# Vision

Build an LMS that is:

- Simple
- Fast
- Modern
- Mobile Friendly
- Easy to maintain
- Highly scalable

The project should be modular and production-ready.

Never sacrifice maintainability for speed.

---

# Tech Stack

## Frontend

- Vite
- React 19
- TypeScript
- Tailwind CSS
- React Router
- React Hook Form
- Zod
- TanStack Query

## Backend

- Django
- Django REST Framework
- PostgreSQL
- Redis
- Celery

## Storage

Cloudinary

## Authentication

JWT Authentication

Access Token

Refresh Token

Email Verification

## Email

Resend

---

# Architecture

The architecture follows feature-first principles.

Never organize code by file type.

Prefer:

features/
    authentication/
    applications/
    programs/
    cohorts/
    weeks/
    assignments/

instead of

components/
pages/
hooks/

Business logic belongs inside services.

Views/controllers should stay thin.

---

# Product Structure

Programs

↓

Cohorts

↓

Weeks

↓

Resources

↓

Assignments

↓

Submissions

Students always belong to exactly one active cohort.

Programs may have multiple cohorts.

Teachers may teach multiple cohorts.

---

# User Roles

There are four roles.

Super Admin

Admin

Teacher

Student

Never hardcode permissions.

Always use centralized permission checks.

---

# Standard Feature Workflow

For every feature request, execute the following workflow:

1. Read:
   - AGENTS.md
   - PROJECT_CONTEXT.md
   - TASKS.md
   - Relevant PRD or documentation

2. Update TASKS.md:
   - Change feature status to "In Progress".

3. Design:
   - Database changes
   - API endpoints
   - Permissions
   - UI flow

4. Implement:
   - Backend
   - Frontend
   - Tests

5. Validate:
   - Lint
   - Type checks
   - Tests
   - Accessibility
   - Mobile responsiveness

6. Update Documentation:
   - API docs
   - Database docs
   - Architecture docs (if needed)

7. Update CHANGELOG.md.

8. Mark feature as "Completed" in TASKS.md.

Never skip any step.

# Project Context Policy

`PROJECT_CONTEXT.md` is the operational status document for Skilix.

Every AI agent must:

1. Read `PROJECT_CONTEXT.md` before beginning any task.
2. Verify the current sprint and implementation priorities.
3. Confirm that the requested work aligns with the current roadmap.
4. Update `PROJECT_CONTEXT.md` whenever:
   - A sprint changes.
   - A feature moves to "Completed".
   - A new feature enters "In Progress".
   - Technical debt is introduced or resolved.
   - Known issues are discovered or fixed.
   - The architecture or roadmap changes.

If `PROJECT_CONTEXT.md`, `TASKS.md`, and `CHANGELOG.md` disagree, resolve the inconsistency before continuing development.

---

# Business Rules

A student belongs to one active cohort.

Applications must be approved before creating an account.

Invitation expires after configured duration.

Inactive users cannot log in.

Assignments lock after grading.

Late submissions are flagged automatically.

Teachers cannot approve applications.

Admins cannot change platform settings.

Only Super Admins manage platform settings.

Announcements are scoped by Program or Cohort.

---

# Development Principles

Always build production-ready code.

Avoid quick fixes.

Avoid hacks.

Write reusable components.

Never duplicate business logic.

---

# Common Commands

Run commands from the repository root unless noted otherwise.

## Service URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api/`
- Backend health check: `http://localhost:8000/api/health/`
- PostgreSQL: internal Docker host `postgres:5432`
- Redis: internal Docker host `redis:6379`

## Local Development

- Copy environment template: `cp .env.example .env`
- Start all services: `docker compose up --build`
- Start all services in the background: `docker compose up --build -d`
- Stop services: `docker compose down`
- View logs: `docker compose logs -f`
- Rebuild images: `docker compose build`

## Backend

- Run migrations: `docker compose run --rm backend python manage.py migrate`
- Seed local development data: `docker compose run --rm backend python manage.py seed_development_data`
- Create superuser: `docker compose run --rm backend python manage.py createsuperuser`
- Open Django shell: `docker compose run --rm backend python manage.py shell`
- Run backend tests: `docker compose run --rm backend pytest`
- Run Django system checks: `docker compose run --rm backend python manage.py check`
- Make migrations after model changes: `docker compose run --rm backend python manage.py makemigrations`

## Frontend

- Install frontend dependencies locally: `npm --prefix apps/frontend ci`
- Run frontend locally without Docker: `npm --prefix apps/frontend run dev`
- Build frontend: `npm --prefix apps/frontend run build`
- Typecheck frontend: `npm --prefix apps/frontend run typecheck`
- Lint frontend: `npm --prefix apps/frontend run lint`
- Run frontend tests: `npm --prefix apps/frontend run test`

## Containers

- Open backend container shell: `docker compose run --rm backend sh`
- Open frontend container shell: `docker compose run --rm frontend sh`
- Run Celery worker logs: `docker compose logs -f celery`
- Run Celery beat logs: `docker compose logs -f celery-beat`

## Destructive Local Reset

This removes local database, media, and dependency volumes.

`docker compose down -v`

Keep files small.

Prefer composition over inheritance.

Write readable code over clever code.

Every feature must include unit tests for the behavior it introduces.

Do not call a feature complete until its tests run successfully.

---

# Coding Standards

Use strict TypeScript.

Never use "any".

Always validate forms with Zod.

Always use React Hook Form.

Prefer small, focused React components.

Keep route-level components thin and move reusable behavior into feature services, hooks, or shared utilities.

Prefer async/await.

Never leave TODO comments.

Never commit dead code.

Never commit commented code.

---

# Backend Standards

Use Django REST Framework.

Business logic belongs inside services.

Views should only orchestrate requests.

Use serializers for validation.

Always validate permissions.

Never trust frontend input.

Use transactions for multi-step operations.

---

# Database Standards

Use PostgreSQL.

Never duplicate data.

Always create migrations.

Never delete migrations.

Use UUID primary keys where appropriate.

Always use foreign keys.

Index searchable fields.

Soft delete only when required.

---

# API Standards

RESTful endpoints.

Use plural resources.

Examples

/api/programs/

/api/cohorts/

/api/applications/

Use proper HTTP status codes.

Return consistent JSON.

Never expose internal IDs unnecessarily.

---

# UI Standards

Use Tailwind utilities.

Follow the design system.

Every page must have:

Loading state

Empty state

Error state

Success state

Responsive layout

Accessible components

---

# Folder Structure

apps/

frontend/

backend/

packages/

docs/

ai/

scripts/

---

# Feature Development Workflow

Every feature follows this order.

1 Read PRD

2 Read Business Rules

3 Design Database

4 Create API

5 Write Backend Unit Tests

6 Write Backend

7 Write Frontend Unit Tests

8 Build Frontend

9 Run Docker-Based Checks

10 Test End-to-End

11 Update Documentation

12 Update TASKS.md

Never skip steps.

---

# Testing Requirements

Every feature must include unit tests for each backend service, API behavior, frontend component, hook, and utility it adds or changes.

Tests are part of the implementation, not a follow-up task.

Every feature must include:

Backend tests

Frontend tests for components, hooks, utilities, forms, and user interactions

API validation

Permission checks

Edge cases

Regression testing

Test both success and failure paths.

Test role-based access for every protected action.

Test form validation and API error states.

Do not merge code with skipped, disabled, or placeholder tests.

When a feature cannot be tested normally, document the reason and add the closest lower-level regression test.

---

# Docker Requirements

Docker is the default runtime for local development, testing, and production-like validation.

Use Docker Compose for multi-service workflows.

Run backend, frontend, PostgreSQL, Redis, Celery, and supporting services through Docker when available.

Never assume services are installed directly on the host machine.

Keep Dockerfiles small, deterministic, and production-aware.

Use separate development and production configuration where needed.

Do not bake secrets into images.

Use environment variables and `.env.example` files for configuration.

Persist database and uploaded-file data with named volumes.

Health checks are required for long-running services.

Containers should run as non-root users where practical.

Use Docker networking instead of hardcoded localhost service assumptions inside containers.

Run migrations through the backend container.

Run tests through the appropriate container whenever Docker configuration exists.

Document every new service, port, volume, and environment variable.

---

# Security

Validate every request.

Never expose secrets.

Never expose stack traces.

Sanitize uploaded files.

Validate uploaded file types.

Use CSRF where applicable.

Protect authenticated routes.

Rate limit sensitive endpoints.

---

# Performance

Paginate list endpoints.

Avoid N+1 queries.

Use select_related/prefetch_related.

Lazy load large components.

Optimize images.

Cache expensive queries.

---

# Accessibility

Keyboard navigation required.

Proper labels.

Semantic HTML.

ARIA only when necessary.

Color contrast must meet accessibility guidelines.

---

# Git Workflow

One feature per branch.

Small commits.

Meaningful commit messages.

Never force push shared branches.

Open Pull Requests for review.

---

# Documentation

Whenever functionality changes, update:

PRD

API documentation

Database documentation

TASKS.md

Relevant ADR if architecture changes.

Documentation is part of the feature.

---

# Definition of Done

A feature is complete only when:

✓ Backend implemented

✓ Frontend implemented

✓ Unit tests added for every new or changed feature behavior

✓ Validation complete

✓ Permission checks complete

✓ Backend tests passing

✓ Frontend tests passing

✓ Docker Compose workflow still works

✓ Documentation updated

✓ No TypeScript errors

✓ No lint errors

✓ No console errors

✓ Mobile responsive

✓ Accessibility checked

---

# Current MVP Modules

Authentication

Applications

Programs

Cohorts

Teacher Assignments

Weeks

Resources

Assignments

Submissions

Grading

Announcements

Leaderboard

Dashboard

Certificates (basic)

---

# Future Modules

Attendance

AI Tutor

AI Quiz Generator

AI Assignment Feedback

Discussion Forums

Messaging

Payments

Portfolio

Employer Dashboard

Mobile App

---

# Things AI Must Never Do

Do not change architecture without updating documentation.

Do not introduce new libraries without justification.

Do not duplicate existing functionality.

Do not bypass validation.

Do not bypass permission checks.

Do not write placeholder implementations.

Do not remove tests.

Do not commit generated secrets.

Do not create circular dependencies.

---

# Primary Goal

Every code change should improve the maintainability, scalability, and reliability of Skilix.

When uncertain, prioritize clean architecture and long-term maintainability over the shortest implementation.
