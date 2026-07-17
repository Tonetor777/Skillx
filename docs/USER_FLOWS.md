# Skilix User Flows

## Applicant to Student

1. Applicant submits `/signup` with name, email, phone, age, experience level, program selection, and program expectations.
2. Admin or Super Admin reviews the signup application in the dashboard.
3. Reviewer selects an eligible cohort in the applicant's program and approval creates an expiring invitation email for that cohort.
4. Applicant accepts the invitation, sets a password, and becomes an active student in exactly one cohort.
5. If the invitation expires before acceptance, Admin or Super Admin can reinvite the approved application from the applications dashboard.
6. Rejected applications retain reviewer and review timestamp metadata.

## Authentication

1. Active users sign in with email and password.
2. Refresh tokens can be refreshed while valid.
3. Expired access tokens are refreshed automatically while the refresh token remains valid.
4. Expired or invalid refresh tokens clear the browser session and return the user to login.
5. Logout blacklists the refresh token.
6. Unverified users can request email verification.
7. Users can request password reset and confirm with the emailed token.

## Program and Cohort Management

1. Admin or Super Admin creates programs and cohorts.
2. Programs can be archived without deleting related cohorts or learning records.
3. Admin or Super Admin can hard delete programs only while they have no cohorts, applications, or announcements.
4. Students only see the program attached to their enrolled cohort.
5. Cohorts expose validated status and current-week management.
6. Admin or Super Admin can hard delete cohorts only while they have no students, invitations, teacher assignments, curriculum, assignments, attendance, or announcements.
7. Admin or Super Admin assigns teachers as lead, assistant, or mentor.

## Learning Delivery

1. Teacher, Admin, or Super Admin creates modules for an accessible cohort.
2. Draft modules remain hidden from students.
3. Publishing stamps publish date and publisher.
4. Staff add ordered lessons/submodules beneath modules with a native rich editor for lesson content.
5. Staff upload inline lesson images after a lesson has been saved.
6. Students read lesson content inline with uploaded images and appended YouTube video embeds inside the dashboard.
7. Resources are ordered supporting links attached to lessons and can be deleted by staff.

## Assignments and Grading

1. Teacher, Admin, or Super Admin creates assignments for lessons, optionally tied to a resource.
2. Teacher, Admin, or Super Admin can edit assignment title, description, points, due date, and lesson scope.
3. Teacher, Admin, or Super Admin can delete assignments with no submissions.
4. Assignments with submissions are locked instead of deleted, preserving submission and grading history.
5. Students submit only to unlocked assignments in their own cohort.
6. Late submissions are flagged automatically.
7. Grading locks the submission for student edits and sends an email notification to the student.
8. Teachers, Admins, and Super Admins can update score and feedback after initial grading.
9. Leaderboards are derived from graded submissions and follow cohort visibility settings.

## Attendance and Weighted Grades

1. Assigned teachers, Admins, or Super Admins create one attendance session per cohort date.
2. Staff mark each student as present, late, excused, or absent.
3. Present and excused count full attendance credit, late counts half, and absent counts zero.
4. Assigned teachers, Admins, or Super Admins set cohort assignment and attendance grade weights that total 100%.
5. Student dashboards show current assignment percent, attendance percent, and weighted total grade.

## Announcement Notifications

1. Teacher, Admin, or Super Admin posts a system, program, or cohort announcement.
2. Each user sees unread counts only for announcements visible through existing scope rules.
3. Scheduled announcements do not appear or count as unread until their scheduled time is due.
4. Users can mark one announcement read or mark all visible announcements read.
5. Read state is per user and does not affect other users.

## Dashboards

1. Student dashboard summarizes progress, current module, weighted grades, and announcements.
2. Teacher dashboard summarizes assigned cohorts, pending grading, and delivery analytics.
3. Admin dashboard summarizes applications, programs, cohorts, and reporting metrics.
