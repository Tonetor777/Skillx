# Skilix API

Base URL in local development: `http://localhost:8000/api/`

## Interactive API Documentation

Generated OpenAPI documentation is available in local development only.

- `GET /api/schema/`: OpenAPI 3 schema.
- `GET /api/docs/`: Swagger UI.

Use JWT bearer authentication in Swagger UI with the value `Bearer <access_token>`.

## Authentication

- `GET /api/health/`: service health check.
- `POST /api/auth/token/`: obtain JWT access and refresh tokens for active users. Response includes `user`.
- `POST /api/auth/token/refresh/`: refresh access token.
- `POST /api/auth/logout/`: blacklist a refresh token for the authenticated user.
- `POST /api/auth/email-verification/request/`: request an email verification message.
- `POST /api/auth/email-verification/confirm/`: confirm an email verification token.
- `POST /api/auth/password-reset/request/`: request a password reset email.
- `POST /api/auth/password-reset/confirm/`: confirm a password reset token and set a new password.
- `GET /api/accounts/me/`: current authenticated user.
- `PATCH /api/accounts/me/`: update current user's profile fields.

## Dashboard Resources

All dashboard endpoints require an active JWT user unless noted otherwise.

- `GET /api/programs/`: list programs.
- `POST /api/programs/`: create a program. Teacher/Admin/Super Admin only.
- `GET /api/programs/{id}/`: retrieve a program.
- `PATCH /api/programs/{id}/`: update a program. Teacher/Admin/Super Admin only.
- `PATCH /api/programs/{id}/archive/`: archive a program without deleting data. Teacher/Admin/Super Admin only.
- `GET /api/cohorts/`: list cohorts scoped to the current user.
- `POST /api/cohorts/`: create a cohort. Teacher/Admin/Super Admin only.
- `GET /api/cohorts/{id}/`: retrieve a cohort.
- `PATCH /api/cohorts/{id}/`: update a cohort, including validated `current_week`, `status`, and `leaderboard_visible`. Teacher/Admin/Super Admin only.
- `GET /api/teacher-assignments/`: list teacher assignments. Admin/Super Admin only.
- `POST /api/teacher-assignments/`: assign a teacher to a cohort with `lead`, `assistant`, or `mentor` role. Admin/Super Admin only.
- `PATCH /api/teacher-assignments/{id}/`: update a teacher assignment role. Admin/Super Admin only.
- `DELETE /api/teacher-assignments/{id}/`: remove a teacher assignment. Admin/Super Admin only.
- `GET /api/weeks/`: list weeks scoped to the current user. Students only see published weeks.
- `POST /api/weeks/`: create a week. Teacher/Admin/Super Admin only.
- `PATCH /api/weeks/{id}/`: update a week. Teacher/Admin/Super Admin only.
- `DELETE /api/weeks/{id}/`: delete a week. Teacher/Admin/Super Admin only.
- `POST /api/weeks/{id}/publish/`: publish a week and stamp publish metadata. Teacher/Admin/Super Admin only.
- `GET /api/resources/`: list resources scoped to accessible weeks. Supports `?week_id=`.
- `POST /api/resources/`: create an ordered URL resource. Teacher/Admin/Super Admin only.
- `PATCH /api/resources/{id}/`: update a resource. Teacher/Admin/Super Admin only.
- `DELETE /api/resources/{id}/`: delete a resource. Teacher/Admin/Super Admin only.
- `GET /api/applications/`: list admissions applications. Admin/Super Admin only.
- `POST /api/applications/`: create a public application. Supports JSON or multipart uploads for `resume` and `payment_proof`.
- `GET /api/applications/{id}/`: retrieve an application. Admin/Super Admin only.
- `POST /api/applications/{id}/approve/`: approve an application and send an expiring cohort invitation. Admin/Super Admin only.
- `POST /api/applications/{id}/reject/`: reject an application. Admin/Super Admin only.
- `GET /api/invitations/`: list invitations. Admin/Super Admin only.
- `POST /api/invitations/{token}/accept/`: accept a pending invitation and create or activate the student account.
- `POST /api/invitations/{id}/resend/`: resend a pending invitation. Admin/Super Admin only.
- `POST /api/invitations/{id}/revoke/`: revoke a pending invitation. Admin/Super Admin only.
- `GET /api/assignments/`: list assignments scoped to the current user. Supports `?cohort_id=`.
- `POST /api/assignments/`: create an assignment. Teacher/Admin/Super Admin only.
- `GET /api/assignments/{id}/`: retrieve an assignment.
- `PATCH /api/assignments/{id}/`: update an assignment. Teacher/Admin/Super Admin only.
- `GET /api/submissions/`: list submissions scoped to the current user. Supports `?assignment_id=`.
- `POST /api/submissions/`: create or update the current student's submission.
- `GET /api/submissions/{id}/`: retrieve a submission.
- `POST /api/submissions/{id}/grade/`: grade and lock a submission. Teacher/Admin/Super Admin only.
- `GET /api/announcements/`: list announcements scoped to the current user. Supports `?target_type=` and `?target_id=`.
- `POST /api/announcements/`: create an announcement. Teacher/Admin/Super Admin only.
- `scheduled_for` may be provided on announcements; future announcements are hidden until due.
- `GET /api/leaderboard/?cohort_id=...`: retrieve cohort ranking from graded submissions. Hidden cohorts are only visible to Admin/Super Admin.
- `GET /api/dashboard/summary/`: retrieve role-specific dashboard summary data.
- `GET /api/settings/`: retrieve platform settings.
- `POST /api/settings/`: update platform settings. Super Admin only.
- `PATCH /api/settings/`: update platform settings. Super Admin only.

Response DTOs are shaped for the Vite frontend, including string IDs, lower-case role/status values, and display fields such as `program_name`, `cohort_name`, `students_count`, `teachers`, `author_name`, and `reviewed_by_name`.
