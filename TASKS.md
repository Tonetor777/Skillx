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
| JWT Authentication | ✅ | Simple JWT token and refresh endpoints are configured with explicit session expiry handling. |
| Login | ✅ | Vite frontend uses backend JWT token endpoint and current-user DTO. |
| Logout | ✅ | Server-side JWT refresh token blacklist endpoint is implemented. |
| Refresh Token | ✅ | Simple JWT refresh endpoint is configured. |
| Email Verification | ✅ | Signed email verification token request/confirm flow is implemented. |
| Password Reset | ✅ | Password reset request/confirm flow is implemented. |
| Password Confirmation and Visibility | ✅ Completed | Invitation acceptance and password reset require matching confirmation fields, with password visibility toggles on auth screens. |
| Role-based Access Control | ✅ | Central role/status constants and permission helpers enforce integrated API endpoints. |

---

# Applications

| Feature | Status | Notes |
|----------|--------|-------|
| Signup to Program | ✅ | Public `/signup` frontend submission flow creates pending student signup applications. |
| Signup Field Update | ✅ Completed | Public signup now collects first name, last name, email, phone number, age, choice-based experience level, and program expectations while removing country. |
| Upload Resume | ✅ Removed | Removed from the redesigned MVP application flow. |
| Upload Payment Proof | ✅ Removed | Removed from the redesigned MVP application flow. |
| Review Applications | ✅ | Admin/Super Admin application review with cohort selection is implemented. |
| Approve Application | ✅ | Approval requires explicit cohort selection and sends an invitation email for password setup. |
| Reject Application | ✅ | Admin/Super Admin rejection API records review metadata. |
| Invitation Email | ✅ | Expiring invitation email, accept, resend, and revoke flow is implemented. |
| Reinvite Approved Application | ✅ Completed | Admin/Super Admin dashboard can resend a fresh invite for approved applicants whose previous invitation expired. |
| Local Invitation Email Configuration | ✅ Completed | Docker Compose backend services pass email provider environment variables from `.env`. |
| Gmail SMTP Email Delivery | ✅ Completed | Django email settings and Docker environment support Gmail SMTP with an app password. |

---

# Programs

| Feature | Status | Notes |
|----------|--------|-------|
| Program CRUD | ✅ | Backend API and Vite dashboard integration support list/create/update, empty-record hard delete, and student-scoped dashboard visibility. |
| Archive Program | ✅ | Soft archive endpoint preserves data and hides archived programs from default lists. |
| Program Details | ✅ | Detail API returns cohort summary data, embeds live cohort curriculum management, and scopes students to their enrolled program. |

---

# Cohorts

| Feature | Status | Notes |
|----------|--------|-------|
| Cohort CRUD | ✅ | Backend API and Vite dashboard integration support list/create/update and empty-record hard delete. |
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
| Multiple Modules Per Week | ✅ Completed | Backend uniqueness constraint removed so a cohort week can contain multiple modules. |
| Module ordering within weeks | ✅ Completed | Multiple modules in a week are ordered oldest-to-newest so recent modules appear at the bottom. |

---

# Lessons

| Feature | Status | Notes |
|----------|--------|-------|
| Lesson CRUD | ✅ | Backend API and contextual frontend controls are implemented inside the two-pane curriculum layout. |
| Native Lesson Editor | ✅ | TipTap-powered lesson authoring stores structured JSON in `Lesson.content` with plain-text fallback rendering for existing lessons. |
| Inline Lesson Images | ✅ | Lesson-owned image uploads are validated, rendered inline, and referenced by asset id from lesson content. |
| YouTube Lesson Embeds | ✅ | YouTube links in lesson content are detected and rendered as safe appended iframe embeds. |
| Lesson Previous/Next Navigation | ✅ Completed | Lesson footer navigation moves across lessons and same-week modules while stopping at week boundaries. |

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
| Production profile avatar fallback | ✅ Completed | Profile surfaces now render uploaded avatars when present and local initials fallback when absent, with mock profile image URLs removed. |

---

# Assignments

| Feature | Status | Notes |
|----------|--------|-------|
| Assignment CRUD | ✅ Completed | Assignment model/API is linked to lessons and optional resources, with staff edit and delete-or-lock controls. |
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
| Announcement Notifications | ✅ Completed | Per-user unread announcement counts, badges, mark-read actions, and simplified student announcement feed are integrated. |

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
| Curriculum week filtering and compact sidebar | ✅ Completed | Curriculum navigation now selects unique weeks, filters modules to the selected week, and compacts the desktop sidebar on Program and Modules workspaces. |

---

# Production Readiness

| Feature | Status | Notes |
|----------|--------|-------|
| Production security settings | ✅ Completed | Django settings enforce strong runtime secrets for production and expose env-driven HTTPS, CORS, CSRF, HSTS, cookie, proxy, and throttle settings. |
| Resend email delivery | ✅ Completed | Resend-compatible Django email backend is available as an alternate integration. |
| Gmail SMTP email delivery | ✅ Completed | Gmail SMTP settings with app-password support are implemented as the active email delivery path. |
| Branded transactional email templates | ✅ Completed | User-facing email services send multipart text/HTML templates for verification, password reset, invitations, and grading notifications. |
| Railway backend deployment | ✅ Completed | Root Railway config and backend Dockerfile are available with migration, Gunicorn, and health check commands. |
| Vercel frontend deployment | ✅ Completed | Vercel SPA rewrite remains configured; production `VITE_API_URL` is documented. |
| Dokploy all-in-one deployment | ✅ Completed | Production compose stack, frontend Nginx image, and Dokploy runbook are available for separate frontend/API domains. |
| Dokploy CI/CD | ✅ Completed | GitHub Actions validates frontend/backend release checks and triggers Dokploy through a webhook after `main` passes CI; frontend tests enumerate concrete test files for Node 20 CI compatibility. |
| Frontend bundle readiness | ✅ Completed | Route-level lazy loading is implemented and API debug logging has been removed. |
| Frontend production tests | ✅ Completed | Existing tests are preserved and production API-client logging regression coverage has been added. |
| API schema cleanup | ✅ Completed | Serializer method fields and APIViews are annotated for stable OpenAPI generation. |
| Health check methods | ✅ Completed | Backend health check supports GET and HEAD smoke checks. |
| High-severity security hardening | ✅ Completed | Teacher/admin structural boundaries, scoped teacher announcements, safe invitation acceptance, and public signup program validation are enforced with regression tests. |
| Medium-severity stability and performance hardening | ✅ Completed | Bounded API pagination, dashboard query aggregation, and resilient frontend auth storage handling are implemented with backend/frontend regression tests. |
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
