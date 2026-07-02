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

Foundation Development

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

Students apply to Programs and are enrolled into Cohorts after approval.

---

# MVP Goal

Deliver a production-ready LMS that supports:

- Student applications
- Admissions workflow
- Programs
- Cohorts
- Teacher assignment
- Weekly learning content
- Assignment submissions
- Grading
- Announcements
- Progress tracking
- Leaderboards
- Basic certificates

The MVP intentionally excludes advanced collaboration and AI features.

---

# Current Sprint

Sprint 1 – Foundation

Primary Goals

- Establish project architecture
- Configure monorepo
- Set up frontend
- Set up backend
- Configure authentication
- Design database
- Create reusable UI components

---

# Current Focus

Priority Order

1. Authentication
2. Programs
3. Cohorts
4. Applications
5. Invitations
6. Teacher Assignment
7. Weekly Content
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

- Cloudinary

## Email

- Resend

## Deployment

Frontend

- Static hosting or containerized Vite build

Backend

- Railway

Database

- Railway PostgreSQL (development) or Supabase PostgreSQL

## Recent Foundation Fixes

- Vite frontend now has a Nexus-inspired monochrome academy UI layer with grid backgrounds, sharp bordered surfaces, reusable presentation components, and Amharic major titles.
- Local Docker development allows Django requests addressed to `0.0.0.0:8000` through `DJANGO_ALLOWED_HOSTS`.
- Development-only Swagger/OpenAPI documentation is available at `/api/docs/` and `/api/schema/`.
- Docker Compose now runs Django migrations before starting backend services so installed app tables, including Simple JWT token blacklist tables, exist before API requests are served.

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
- Weeks
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

✅ Dashboard list/create/update/archive/detail API integrated

Cohorts

✅ Dashboard list/create/update API integrated with current-week and status management

Teacher Assignments

✅ Admin/Super Admin assignment, removal, and role validation API integrated

Weekly Content

✅ Week CRUD, publish workflow, and ordered resource API integrated

Applications

✅ Public submission, upload validation, review, approve/reject, and invitation API integrated

Assignments

✅ Assignment and submission APIs integrated

Announcements

✅ Announcement API integrated

Dashboard

✅ Frontend dashboard shells use Django API by default

Leaderboard and Summaries

✅ Cohort leaderboard, scheduled announcements, grade notification, and role-specific summary APIs integrated

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
- Public applications with resume/payment proof validation and expiring invitations
- Teacher assignment workflow with lead, assistant, and mentor roles
- Week CRUD/publishing and ordered resource management
- Grade notifications, scheduled announcement visibility, leaderboard visibility, and role-specific summaries
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

- Attendance
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

- Students can apply to programs.
- Admins can approve applications.
- Invitations create accounts securely.
- Teachers can manage weekly content.
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
