# Skilix User Flows

## Applicant to Student

1. Applicant submits `/apply` with program, motivation, contact details, resume, and payment proof.
2. Admin or Super Admin reviews the application in the dashboard.
3. Approval creates an expiring invitation email for the selected cohort.
4. Applicant accepts the invitation, sets a password, and becomes an active student in exactly one cohort.
5. Rejected applications retain reviewer and review timestamp metadata.

## Authentication

1. Active users sign in with email and password.
2. Refresh tokens can be refreshed while valid.
3. Logout blacklists the refresh token.
4. Unverified users can request email verification.
5. Users can request password reset and confirm with the emailed token.

## Program and Cohort Management

1. Admin or Super Admin creates programs and cohorts.
2. Programs can be archived without deleting related cohorts or learning records.
3. Cohorts expose validated status and current-week management.
4. Admin or Super Admin assigns teachers as lead, assistant, or mentor.

## Learning Delivery

1. Teacher, Admin, or Super Admin creates weekly content for an accessible cohort.
2. Draft weeks remain hidden from students.
3. Publishing stamps publish date and publisher.
4. Resources are ordered links attached to weeks and can be deleted by staff.

## Assignments and Grading

1. Teacher, Admin, or Super Admin creates assignments.
2. Students submit only to assignments in their own cohort.
3. Late submissions are flagged automatically.
4. Grading locks the submission and sends an email notification to the student.
5. Leaderboards are derived from graded submissions and follow cohort visibility settings.

## Dashboards

1. Student dashboard summarizes progress, current week, grades, and announcements.
2. Teacher dashboard summarizes assigned cohorts, pending grading, and delivery analytics.
3. Admin dashboard summarizes applications, programs, cohorts, and reporting metrics.
