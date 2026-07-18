# PROJECT_CONTEXT.md

# Skilix Project Context

> **Purpose**
>
> This file provides the current state of the Skilix project.
>
> It is intended for AI coding agents (Codex, Claude Code, Cursor, GitHub Copilot) and human developers.
>
> Unlike `AGENTS.md`, which contains permanent development rules, this file changes throughout development.
>
> AI MUST read this file before implementing any feature.

---

# Project Information

**Project Name**

Skilix

**Current Version**

0.1.0 (MVP)

**Development Phase**

MVP Production Readiness

**Repository Type**

Monorepo

---

# Product Summary

Skilix is a modern cohort-based Learning Management System (LMS) built for bootcamps, academies, and training organizations.

The platform manages the complete student lifecycle:

Application
→ Admission Review
→ Invitation
→ Enrollment
→ Course Delivery
→ Assessments
→ Grading
→ Graduation

Unlike traditional LMS platforms, Skilix organizes learning around **Programs** and **Cohorts**.

Example

AI Engineering
├── January 2027
├── March 2027
└── July 2027

Students sign up for Programs and are enrolled into Cohorts after Admin or Super Admin approval and invitation acceptance.

---

# MVP Goal

Deliver a production-ready LMS that supports:

- Student applications
- Admissions workflow
- Programs
- Cohorts
- Teacher assignment
- Module and lesson learning content
- Assignment submissions
- Grading
- Announcements
- Progress tracking
- Leaderboards
- Basic certificates

The MVP intentionally excludes advanced collaboration and AI features.

---

# Current Sprint

Sprint 2 – Production Readiness

Primary Goals

- Harden Django production security settings
- Configure Gmail SMTP-backed production email delivery
- Prepare Railway backend deployment
- Prepare Vercel frontend deployment
- Clean OpenAPI schema generation
- Reduce frontend production bundle risk
- Expand release validation coverage

---

# Current Focus

Priority Order

1. Authentication
2. Programs
3. Cohorts
4. Applications
5. Invitations
6. Teacher Assignment
7. Module Content
8. Assignments
9. Grading
10. Dashboard

Do not begin lower-priority modules unless dependencies are complete.

---

# Tech Stack

## Frontend

- Vite
- React 19
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- React Hook Form
- Zod

## Backend

- Django
- Django REST Framework
- Simple JWT
- Celery
- Redis

## Database

- PostgreSQL

## Storage

- MinIO / S3-compatible object storage

## Email

- Gmail SMTP with an app password
- Resend backend remains available as an alternate integration

## Deployment

Frontend

- Dokploy Nginx static container or Vercel static hosting

Backend

- Dokploy Django/Gunicorn container or Railway

Database

- Dokploy PostgreSQL named volume, Railway PostgreSQL, or Supabase PostgreSQL

## Recent Foundation Fixes

- Admissions approval now requires Admin/Super Admin reviewers to choose an eligible cohort in the applicant's selected program before an invitation is sent.
- Approved admissions applications can be reinvited from the dashboard, issuing a fresh invitation link against the original approval cohort when the previous link expired.
- Admin/Super Admin users can hard delete empty programs and cohorts, while non-empty records remain protected and should be archived instead.
- Announcement notifications now track per-user unread state, expose unread-count and mark-read APIs, and show unread badges in the dashboard.
- Assignment management now supports staff edits plus delete-or-lock behavior: empty assignments can be deleted, while assignments with submissions are preserved and locked against further student submissions.
- Production-readiness work is now underway: Django settings enforce strong production secrets, expose env-driven HTTPS/CORS/CSRF settings, add DRF throttling, and support Gmail SMTP email delivery with Resend still available as an alternate backend.
- Dokploy all-in-one production deployment is available through `docker-compose.dokploy.yml`, with frontend, backend, migrations, Celery, PostgreSQL, Redis, and MinIO services.
- GitHub Actions now validates the Dokploy stack and triggers Dokploy deployments through a repository-secret webhook after `main` passes CI.
- Local Docker backend services now receive explicit debug and secret-key compose defaults so development startup is not affected by production-like host shell variables.
- Railway deployment configuration now builds the backend from the repository root, runs migrations before deploy, starts Gunicorn, and uses `/api/health/` as the health check.
- Vite route pages are lazy-loaded to improve production bundle splitting, and frontend API debug logging has been removed.
- Lesson delivery now uses a TipTap-powered native lesson editor for teacher-authored structured content, uploaded inline images, and appended YouTube embeds, rendered inline for students while preserving existing plain-text lesson content.
- Curriculum delivery now uses a reference-style two-pane layout with a left module/lesson navigator and a right lesson reading canvas in both Modules and embedded Program curriculum views.
- Attendance is now cohort-date based, contributes to weighted student total grades, and can be recorded by assigned teachers/Admin/Super Admins.
- Media uploads now support private MinIO/S3-compatible storage when S3 environment variables are configured, with signed URL responses for profile photos, program thumbnails, and lesson images.
- Student signup no longer collects resume or payment proof uploads and now uses `/signup` with `/apply` redirected for compatibility.
- Student signup now collects first name, last name, email, phone number, age, choice-based experience level, and program expectations while no longer collecting country.
- Student program APIs are scoped so students only see the program attached to their enrolled cohort.
- Vite frontend now has a Nexus-inspired monochrome academy UI layer with grid backgrounds, sharp bordered surfaces, reusable presentation components, and Amharic major titles.
- Local Docker development allows Django requests addressed to `0.0.0.0:8000` through `DJANGO_ALLOWED_HOSTS`.
- Development-only Swagger/OpenAPI documentation is available at `/api/docs/` and `/api/schema/`.
- Docker Compose now runs Django migrations before starting backend services so installed app tables, including Simple JWT token blacklist tables, exist before API requests are served.
- Local Docker backend, migration, Celery, and beat services now receive Gmail SMTP environment variables from `.env` so invitation approval sends through the configured email backend instead of the console backend.
- Django email settings now select Gmail SMTP when `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` are configured, while retaining Resend as a fallback integration.
- The production-facing login page no longer exposes fast-track seeded testing account buttons.
- Dokploy services now attach to an explicit internal bridge network with stable `postgres`, `redis`, and `minio` aliases to avoid generated-network DNS resolution failures.
- Django admin static assets are served by WhiteNoise in production so the admin UI renders with collected CSS/JS behind Gunicorn.
- Student overview now shows the enrolled cohort/program from live cohort data and removes broad internal guidance copy from the student dashboard.
- Student Programs dashboard visibility now defensively scopes students to the program attached to their enrolled cohort, including local mock API responses.
- Student-facing dashboard pages now hide broad operational helper copy while preserving staff/admin guidance and required state messages.
- Student announcements now render as a simple scoped feed without system/program/cohort filter tabs, while staff/admin filters remain available.
- Expired access tokens now retry through refresh cleanly, invalid refresh tokens clear the browser session, and JWT lifetimes are explicit production environment settings.
- Curriculum modules now allow multiple modules within the same cohort week by treating `module_number` as the week grouping value instead of a unique module slot.
- Curriculum navigation now presents unique week choices, filters module cards to the selected week, and gives Program/Modules workspaces a compact hover-expanding desktop sidebar.
- Profile UI now uses uploaded avatars or a local initials fallback, with external mock profile image URLs removed from production-facing surfaces and mock seed users.
- Modules sharing a curriculum week now render in creation order so newly added modules appear at the bottom of that week.

---

# Architecture

Monorepo

apps/

frontend/

backend/

packages/

shared-ui

shared-types

api-client

docs/

ai/

Business logic belongs in the backend.

Frontend should remain presentation-focused.

---

# User Roles

There are four system roles.

## Super Admin

Platform administration.

## Admin

Academy management.

## Teacher

Academic delivery.

## Student

Learning.

Permissions are role-based and centralized.

Never hardcode permissions.

---

# Core Business Rules

Students belong to exactly one active cohort.

Programs may contain multiple cohorts.

Teachers may teach multiple cohorts.

Applications must be approved before accounts exist.

Invitation emails expire.

Assignments lock after grading.

Late submissions are flagged automatically.

Students never access another cohort's data.

Every API must respect cohort isolation.

---

# Current Database Status

Status

✅ Frontend Integration Schema Created

Primary Entities

- Users
- Programs
- Cohorts
- Applications
- Invitations
- TeacherAssignments
- Modules
- Lessons
- Resources
- Assignments
- Submissions
- Announcements
- PlatformSettings

Future entities should not be added without updating documentation.

---

# Current API Status

Authentication

✅ JWT token, refresh, logout, email verification, password reset, and current-user DTO endpoints integrated

Programs

✅ Dashboard list/create/update/archive/detail API integrated, with empty-record hard delete for Admin/Super Admin users

Cohorts

✅ Dashboard list/create/update API integrated with current-week/status management and empty-record hard delete for Admin/Super Admin users

Teacher Assignments

✅ Admin/Super Admin assignment, removal, and role validation API integrated

Module Content

✅ Frontend curriculum controls use nested week/module/lesson panels in Program detail and Modules views, including native rich lesson authoring and inline student rendering.

Applications

✅ Public signup submission, upload validation, Admin/Super Admin review, cohort-selected approve/reject, and invitation API integrated

Assignments

✅ Assignment edit/delete/lock workflow integrated with submission-history protection.

Announcements

✅ Announcement API integrated
✅ Per-user unread announcement notifications integrated.

Dashboard

✅ Frontend dashboard shells use Django API by default

Leaderboard and Summaries

✅ Cohort leaderboard, scheduled announcements, grade notification, attendance-weighted grade totals, and role-specific summary APIs integrated

---

# Completed Features

- Monorepo foundation
- Docker development stack
- Backend project scaffold
- Frontend project scaffold
- Initial database schema
- Backend health endpoint
- JWT token and refresh endpoints
- JWT logout, email verification, and password reset workflows
- Vite frontend to Django API integration
- Dashboard APIs for programs, cohorts, applications, assignments, submissions, announcements, and settings
- Program archive/details and cohort current-week/status management
- Public applications without document uploads and expiring invitations
- Teacher assignment workflow with lead, assistant, and mentor roles
- Program detail live curriculum management, nested week/module/lesson panels, module CRUD/publishing, lesson management, and ordered resource management
- Assignment staff edit controls and delete-or-lock protection for submitted assignments
- Native rich lesson editor with plain-text fallback rendering for existing lessons
- Grade notifications, scheduled announcement visibility, leaderboard visibility, and role-specific summaries
- Per-user announcement unread counts and mark-read dashboard controls
- User flow documentation
- Local development seed command
- Foundation documentation

Update this section after every completed feature.

Example

- JWT Authentication
- Program CRUD
- Cohort CRUD

---

# Features In Progress

_None currently._

Only features actively being developed belong here.

---

# Known Issues

- Git metadata appears incomplete in this workspace; `git status` may fail until the repository is repaired or reinitialized.
- Docker image builds may fail if Docker cannot resolve Docker Hub for uncached base images.

Document bugs here.

---

# Technical Debt

None

Document shortcuts that should be revisited.

---

# Architectural Constraints

The frontend must never contain business logic.

Permissions belong in the backend.

Database schema changes require migrations.

API contracts must remain consistent.

Business rules must not be duplicated.

Shared code belongs inside packages/.

---

# Performance Goals

Support thousands of concurrent students.

Paginate all list endpoints.

Avoid N+1 queries.

Use select_related and prefetch_related.

Optimize images.

Lazy-load large frontend modules.

---

# Security Goals

JWT Authentication

Email Verification

Permission-based authorization

Rate limiting

Input validation

File validation

Secure file uploads

CSRF protection where appropriate

No secrets committed to the repository

---

# Coding Priorities

When multiple solutions exist, prefer the one that is:

1. Easiest to maintain
2. Most readable
3. Most modular
4. Most reusable
5. Most scalable

Avoid clever code.

Prefer explicit implementations.

---

# AI Development Rules

Before implementing any feature:

1. Read AGENTS.md.
2. Read PROJECT_CONTEXT.md.
3. Read TASKS.md.
4. Read the relevant documentation.
5. Confirm business rules.
6. Design before coding.

After implementation:

- Run tests.
- Update documentation.
- Update TASKS.md.
- Update CHANGELOG.md.
- Update this file if project status has changed.

Never skip documentation updates.

---

# Immediate Next Tasks

1. Create monorepo structure.
2. Configure Docker.
3. Maintain Vite frontend shell.
4. Initialize Django backend.
5. Configure PostgreSQL.
6. Configure authentication.
7. Create initial database schema.

---

# Future Roadmap

## Version 1.1

- Calendar
- Certificates

## Version 1.2

- Notifications
- Student analytics
- Teacher analytics

## Version 2.0

- AI Tutor
- AI Assignment Feedback
- AI Quiz Generator
- AI Course Assistant

## Version 3.0

- Messaging
- Discussion Forums
- Student Portfolio
- Employer Dashboard
- Mobile Applications

---

# Success Metrics

The MVP is considered successful when:

- Students can sign up for programs.
- Admins and Super Admins can approve signup applications.
- Invitations create accounts securely.
- Teachers can manage module and lesson content.
- Students can submit assignments.
- Teachers can grade assignments.
- Students can track progress.
- Cohort isolation is enforced.
- The platform is production-ready.
- Documentation is complete.

---

# Last Updated

Date: 2026-07-02

Updated By: Codex

Reason: Integrated the Vite frontend with Django REST APIs, added seed data, tests, and API documentation.
