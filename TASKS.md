# Skilix Development Tasks

> This file is the single source of truth for the current development status.
>
> AI agents MUST update this file whenever work begins, progresses, or completes.
>
> Status values:
>
> - ⬜ Not Started
> - 🟡 In Progress
> - ✅ Completed
> - ⛔ Blocked

---

# Current Sprint

Sprint: MVP Production Readiness

Goal:

Build the first production-ready version of Skilix.

---

# Authentication

| Feature | Status | Notes |
|----------|--------|-------|
| User Model | ✅ | Custom Django user with roles, statuses, profile fields, and cohort relationship. |
| JWT Authentication | ✅ | Simple JWT token and refresh endpoints are configured. |
| Login | ✅ | Vite frontend uses backend JWT token endpoint and current-user DTO. |
| Logout | ✅ | Server-side JWT refresh token blacklist endpoint is implemented. |
| Refresh Token | ✅ | Simple JWT refresh endpoint is configured. |
| Email Verification | ✅ | Signed email verification token request/confirm flow is implemented. |
| Password Reset | ✅ | Password reset request/confirm flow is implemented. |
| Role-based Access Control | ✅ | Central role/status constants and permission helpers enforce integrated API endpoints. |

---

# Applications

| Feature | Status | Notes |
|----------|--------|-------|
| Signup to Program | ✅ | Public `/signup` frontend submission flow creates pending student signup applications. |
| Upload Resume | ✅ Removed | Removed from the redesigned MVP application flow. |
| Upload Payment Proof | ✅ Removed | Removed from the redesigned MVP application flow. |
| Review Applications | ✅ | Super Admin-only API with frontend DTOs and tests. |
| Approve Application | ✅ | Super Admin approval sends an invitation email for password setup. |
| Reject Application | ✅ | Super Admin rejection API records review metadata. |
| Invitation Email | ✅ | Expiring invitation email, accept, resend, and revoke flow is implemented. |

---

# Programs

| Feature | Status | Notes |
|----------|--------|-------|
| Program CRUD | ✅ | Backend API and Vite dashboard integration are implemented for list/create/update. |
| Archive Program | ✅ | Soft archive endpoint preserves data and hides archived programs from default lists. |
| Program Details | ✅ | Detail API returns cohort summary data, embeds live cohort curriculum management, and scopes students to their enrolled program. |

---

# Cohorts

| Feature | Status | Notes |
|----------|--------|-------|
| Cohort CRUD | ✅ | Backend API and Vite dashboard integration are implemented for list/create/update. |
| Current Week | ✅ | Validated API/UI management is implemented. |
| Status Management | ✅ | Validated API/UI status management is implemented. |

---

# Teacher Assignments

| Feature | Status | Notes |
|----------|--------|-------|
| Assign Teacher | ✅ | Admin/Super Admin API and dashboard controls assign teachers to cohorts. |
| Remove Teacher | ✅ | Admin/Super Admin API and dashboard controls remove teacher assignments. |
| Teacher Roles | ✅ | Lead, assistant, and mentor role validation is enforced. |

---

# Modules

| Feature | Status | Notes |
|----------|--------|-------|
| Module CRUD | ✅ | Backend API and reference-style two-pane frontend controls are implemented in Program curriculum and Modules views. |
| Publish Module | ✅ | Publish action sets status, publish date, and publisher. |
| Draft Support | ✅ | Draft/published/archived API support is implemented for modules. |

---

# Lessons

| Feature | Status | Notes |
|----------|--------|-------|
| Lesson CRUD | ✅ | Backend API and contextual frontend controls are implemented inside the two-pane curriculum layout. |
| Native Lesson Editor | ✅ | TipTap-powered lesson authoring stores structured JSON in `Lesson.content` with plain-text fallback rendering for existing lessons. |
| Inline Lesson Images | ✅ | Lesson-owned image uploads are validated, rendered inline, and referenced by asset id from lesson content. |
| YouTube Lesson Embeds | ✅ | YouTube links in lesson content are detected and rendered as safe appended iframe embeds. |

---

# Resources

| Feature | Status | Notes |
|----------|--------|-------|
| Upload Resource | ✅ | Resource URL create/list/update workflow is lesson-scoped inside nested lesson panels. |
| Delete Resource | ✅ | Resource delete API and nested lesson-panel deletion controls are implemented. |
| Ordering | ✅ | Resource ordering is exposed through the API. |

---

# Media Storage

| Feature | Status | Notes |
|----------|--------|-------|
| MinIO media URLs | ✅ Completed | Private S3-compatible MinIO storage is available when configured, with signed URL responses for profile photos and program thumbnails. |
| Lesson media URLs | ✅ Completed | Lesson image assets return fresh media URLs and avoid storing expiring signed URLs in lesson content. |

---

# Assignments

| Feature | Status | Notes |
|----------|--------|-------|
| Assignment CRUD | ✅ | Assignment model/API is linked to lessons and optional resources. |
| Submission | ✅ | Assignment-based submission API creates or updates the current student's submission. |
| Late Detection | ✅ | Submissions are flagged late when submitted after assignment due date. |
| Lock After Grading | ✅ | Grading locks student edits after score/feedback are recorded, while staff can correct grades. |

---

# Grading

| Feature | Status | Notes |
|----------|--------|-------|
| Grade Submission | ✅ | Teacher/Admin/Super Admin grading API supports initial grading and later grade corrections. |
| Feedback | ✅ | Feedback is stored with grading and returned in frontend DTOs. |
| Notifications | ✅ | Grade email notification is sent when a submission is graded. |

---

# Attendance

| Feature | Status | Notes |
|----------|--------|-------|
| Cohort Attendance | ✅ Completed | Assigned teachers/Admin/Super Admins can record per-date cohort attendance. |
| Attendance Grade Weight | ✅ Completed | Cohort assignment/attendance weights default to 90/10 and must total 100. |
| Student Total Grade | ✅ Completed | Student dashboard shows weighted total grade from assignments and attendance. |

---

# Announcements

| Feature | Status | Notes |
|----------|--------|-------|
| Program Announcement | ✅ | Program-scoped announcements are exposed through the API. |
| Cohort Announcement | ✅ | Cohort-scoped announcements are exposed through the API. |
| Schedule Announcement | ✅ | Future scheduled announcements remain hidden until due. |

---

# Leaderboard

| Feature | Status | Notes |
|----------|--------|-------|
| Ranking | ✅ | Cohort ranking API is implemented from graded submissions. |
| Visibility Rules | ✅ | Leaderboard visibility is enforced per cohort. |

---

# Dashboard

## Student

- ✅ Progress
- ✅ Current Week
- ✅ Weighted Grades
- ✅ Announcements

## Teacher

- ✅ Assigned Cohorts
- ✅ Pending Grading
- ✅ Analytics

## Admin

- ✅ Applications
- ✅ Programs
- ✅ Cohorts
- ✅ Reports

---

# Frontend Design System

| Feature | Status | Notes |
|----------|--------|-------|
| Nexus-inspired UI refresh | ✅ Completed | Vite UI refreshed with monochrome academy styling, grid backgrounds, sharp bordered panels, reusable presentation components, and Amharic major titles. |
| Reference-style curriculum layout | ✅ Completed | Modules and embedded Program curriculum now use a left module/lesson navigator with a right reading canvas. |

---

# Production Readiness

| Feature | Status | Notes |
|----------|--------|-------|
| Production security settings | ✅ Completed | Django settings enforce strong runtime secrets for production and expose env-driven HTTPS, CORS, CSRF, HSTS, cookie, proxy, and throttle settings. |
| Resend email delivery | ✅ Completed | Resend-compatible Django email backend is implemented while console email remains the local default. |
| Railway backend deployment | ✅ Completed | Root Railway config and backend Dockerfile are available with migration, Gunicorn, and health check commands. |
| Vercel frontend deployment | ✅ Completed | Vercel SPA rewrite remains configured; production `VITE_API_URL` is documented. |
| Dokploy all-in-one deployment | ✅ Completed | Production compose stack, frontend Nginx image, and Dokploy runbook are available for separate frontend/API domains. |
| Frontend bundle readiness | ✅ Completed | Route-level lazy loading is implemented and API debug logging has been removed. |
| Frontend production tests | ✅ Completed | Existing tests are preserved and production API-client logging regression coverage has been added. |
| API schema cleanup | ✅ Completed | Serializer method fields and APIViews are annotated for stable OpenAPI generation. |
| Release documentation | ✅ Completed | README, environment template, and Dokploy runbook cover local Docker, MinIO, auto-migrations, release checks, and Dokploy/Railway/Vercel deployment guidance. |

---

# Documentation

| Document | Status |
|----------|--------|
| PRD | ✅ |
| Architecture | ✅ |
| API | ✅ | Static API docs and development-only Swagger/OpenAPI docs are available. |
| ERD | ✅ |
| User Flows | ✅ |

---

# Technical Debt

_None currently._

---

# Known Issues

- Git metadata appears incomplete in this workspace; `git status` may fail until the repository is repaired or reinitialized.
- Docker image builds may fail if Docker cannot resolve Docker Hub for uncached base images.
- Manual production smoke tests must be run after real Railway/Vercel URLs and provider credentials are configured.

# Recently Resolved Issues

- Resolved local Django host validation for `0.0.0.0:8000` by including `0.0.0.0` in the default development allowed hosts.
- Added development-only Swagger/OpenAPI documentation for the Django REST API.
- Resolved missing Simple JWT token blacklist tables in local Docker databases by running Django migrations before backend services start.

---

# Next Priority

Authentication → Programs → Cohorts → Applications
