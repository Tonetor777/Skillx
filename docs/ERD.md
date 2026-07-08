# Skilix Data Model

Initial entities:

- `User`: role, status, profile, optional active cohort.
- `Program`: academy program.
- `Cohort`: program-specific cohort.
- `TeacherAssignment`: teacher-to-cohort relationship.
- `Application`: public student application.
- `Invitation`: secure expiring invitation for approved applicants, accepted to activate a student account.
- `Module`: cohort learning unit.
- `Lesson`: ordered submodule/lesson inside a module.
- `Resource`: ordered links attached to a lesson.
- `Assignment`: cohort assignment linked to a lesson and optionally to a resource.
- `Submission`: one student submission per assignment.
- `Announcement`: program or cohort scoped message.
- `PlatformSettings`: singleton platform branding/theme settings.

Students belong to exactly one active cohort. Teachers can be assigned to multiple cohorts.
Leaderboards are derived from graded submissions and respect `Cohort.leaderboard_visible`.
