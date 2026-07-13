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
- `PATCH /api/accounts/me/`: update current user's profile fields. Supports JSON for text fields and multipart uploads for optional `photo`; returns `avatar_url`.

## Dashboard Resources

All dashboard endpoints require an active JWT user unless noted otherwise.

- `GET /api/programs/`: list programs scoped to the current user. Students only see the program attached to their enrolled cohort.
- `GET /api/programs/public/`: public list of active programs for student signup.
- `POST /api/programs/`: create a program. Teacher/Admin/Super Admin only. Supports multipart uploads for optional `thumbnail`; returns `thumbnail_url`.
- `GET /api/programs/{id}/`: retrieve a program.
- `PATCH /api/programs/{id}/`: update a program. Teacher/Admin/Super Admin only. Supports multipart uploads for optional `thumbnail`; returns `thumbnail_url`.
- `PATCH /api/programs/{id}/archive/`: archive a program without deleting data. Teacher/Admin/Super Admin only.
- `GET /api/cohorts/`: list cohorts scoped to the current user.
- `POST /api/cohorts/`: create a cohort. Teacher/Admin/Super Admin only.
- `GET /api/cohorts/{id}/`: retrieve a cohort.
- `PATCH /api/cohorts/{id}/`: update a cohort, including validated `current_week`, `status`, and `leaderboard_visible`. Teacher/Admin/Super Admin only.
- `GET /api/teacher-assignments/`: list teacher assignments. Admin/Super Admin only.
- `POST /api/teacher-assignments/`: assign a teacher to a cohort with `lead`, `assistant`, or `mentor` role. Admin/Super Admin only.
- `PATCH /api/teacher-assignments/{id}/`: update a teacher assignment role. Admin/Super Admin only.
- `DELETE /api/teacher-assignments/{id}/`: remove a teacher assignment. Admin/Super Admin only.
- `GET /api/modules/`: list modules scoped to the current user. Students only see published modules.
- `POST /api/modules/`: create a cohort module. Teacher/Admin/Super Admin only.
- `PATCH /api/modules/{id}/`: update a module. Teacher/Admin/Super Admin only.
- `DELETE /api/modules/{id}/`: delete a module. Teacher/Admin/Super Admin only.
- `POST /api/modules/{id}/publish/`: publish a module and stamp publish metadata. Teacher/Admin/Super Admin only.
- `GET /api/lessons/`: list lessons scoped to accessible modules. Supports `?module_id=`.
- `POST /api/lessons/`: create an ordered lesson/submodule. Teacher/Admin/Super Admin only. `content` may contain serialized TipTap JSON for native lesson rendering, and existing plain text remains supported.
- `PATCH /api/lessons/{id}/`: update a lesson. Teacher/Admin/Super Admin only. `content` stores serialized TipTap JSON; uploaded image nodes reference lesson image asset ids.
- `DELETE /api/lessons/{id}/`: delete a lesson. Teacher/Admin/Super Admin only.
- `GET /api/lesson-images/`: list lesson images scoped to accessible lessons. Supports `?lesson_id=`.
- `POST /api/lesson-images/`: upload a lesson image. Teacher/Admin/Super Admin only. Supports multipart `lesson_id`, `image`, and optional `alt_text`; returns `image_url`.
- `DELETE /api/lesson-images/{id}/`: delete a lesson image. Teacher/Admin/Super Admin only.
- `GET /api/resources/`: list resources scoped to accessible lessons. Supports `?lesson_id=`.
- `POST /api/resources/`: create an ordered URL resource. Teacher/Admin/Super Admin only.
- `PATCH /api/resources/{id}/`: update a resource. Teacher/Admin/Super Admin only.
- `DELETE /api/resources/{id}/`: delete a resource. Teacher/Admin/Super Admin only.
- `GET /api/applications/`: list admissions applications. Super Admin only.
- `POST /api/applications/`: create a public signup application with contact details, program selection, and motivation.
- `GET /api/applications/{id}/`: retrieve an application. Super Admin only.
- `POST /api/applications/{id}/approve/`: approve an application and send an expiring cohort invitation. Super Admin only.
- `POST /api/applications/{id}/reject/`: reject an application. Super Admin only.
- `GET /api/invitations/`: list invitations. Admin/Super Admin only.
- `POST /api/invitations/{token}/accept/`: accept a pending invitation and create or activate the student account.
- `POST /api/invitations/{id}/resend/`: resend a pending invitation. Admin/Super Admin only.
- `POST /api/invitations/{id}/revoke/`: revoke a pending invitation. Admin/Super Admin only.
- `GET /api/assignments/`: list assignments scoped to the current user. Supports `?cohort_id=`, `?lesson_id=`, and `?resource_id=`.
- `POST /api/assignments/`: create an assignment for a lesson, optionally attached to a resource. Teacher/Admin/Super Admin only.
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

## Media Uploads

When `AWS_STORAGE_BUCKET_NAME` and `AWS_S3_ENDPOINT_URL` are configured, new media uploads are stored in private S3-compatible storage such as MinIO and returned through signed URL fields. Without these variables, local Django media storage is used for development.

- Profile `photo`: image files only (`.png`, `.jpg`, `.jpeg`, `.webp`), max 5MB.
- Program `thumbnail`: image files only (`.png`, `.jpg`, `.jpeg`, `.webp`), max 5MB.
- Lesson image `image`: image files only (`.png`, `.jpg`, `.jpeg`, `.webp`), max 5MB. Lesson content stores asset ids, while API responses return fresh `image_url` values for rendering.

## Lesson Embeds

Lesson content may include normal YouTube links in text or link marks. The frontend detects `youtube.com/watch`, `youtu.be`, `youtube.com/embed`, and `youtube.com/shorts` URLs, keeps the original links visible, and appends safe YouTube iframe embeds at the end of the rendered lesson.
