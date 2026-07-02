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

Sprint: MVP Foundation

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
| Apply to Program | ✅ | Public API/frontend submission flow is implemented. |
| Upload Resume | ✅ | Upload validation and frontend submission are implemented. |
| Upload Payment Proof | ✅ | Upload validation and frontend submission are implemented. |
| Review Applications | ✅ | Admin/Super Admin API with frontend DTOs and tests. |
| Approve Application | ✅ | Admin/Super Admin approval API provisions active student accounts. |
| Reject Application | ✅ | Admin/Super Admin rejection API records review metadata. |
| Invitation Email | ✅ | Expiring invitation email, accept, resend, and revoke flow is implemented. |

---

# Programs

| Feature | Status | Notes |
|----------|--------|-------|
| Program CRUD | ✅ | Backend API and Vite dashboard integration are implemented for list/create/update. |
| Archive Program | ✅ | Soft archive endpoint preserves data and hides archived programs from default lists. |
| Program Details | ✅ | Detail API returns cohort summary data for dashboard views. |

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

# Weeks

| Feature | Status | Notes |
|----------|--------|-------|
| Week CRUD | ✅ | Week API CRUD and dashboard content view are implemented. |
| Publish Week | ✅ | Publish action sets status, publish date, and publisher. |
| Draft Support | ✅ | Draft/published/archived API support is implemented. |

---

# Resources

| Feature | Status | Notes |
|----------|--------|-------|
| Upload Resource | ✅ | Resource URL create/list/update workflow is implemented. |
| Delete Resource | ✅ | Resource delete API is implemented. |
| Ordering | ✅ | Resource ordering is exposed through the API. |

---

# Media Storage

| Feature | Status | Notes |
|----------|--------|-------|
| Cloudinary media URLs | 🟡 In Progress | Wiring Cloudinary-backed uploads and URL responses for application files, profile photos, and program thumbnails. |

---

# Assignments

| Feature | Status | Notes |
|----------|--------|-------|
| Assignment CRUD | ✅ | Assignment model/API and Vite dashboard integration are implemented for list/create/update. |
| Submission | ✅ | Assignment-based submission API creates or updates the current student's submission. |
| Late Detection | ✅ | Submissions are flagged late when submitted after assignment due date. |
| Lock After Grading | ✅ | Grading locks the submitted work after score/feedback are recorded. |

---

# Grading

| Feature | Status | Notes |
|----------|--------|-------|
| Grade Submission | ✅ | Teacher/Admin/Super Admin grading API is implemented and tested. |
| Feedback | ✅ | Feedback is stored with grading and returned in frontend DTOs. |
| Notifications | ✅ | Grade email notification is sent when a submission is graded. |

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
- ✅ Grades
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

# Recently Resolved Issues

- Resolved local Django host validation for `0.0.0.0:8000` by including `0.0.0.0` in the default development allowed hosts.
- Added development-only Swagger/OpenAPI documentation for the Django REST API.
- Resolved missing Simple JWT token blacklist tables in local Docker databases by running Django migrations before backend services start.

---

# Next Priority

Authentication → Programs → Cohorts → Applications
