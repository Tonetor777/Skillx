# Skilix Data Model

Initial entities:

- `User`: role, status, profile, optional active cohort.
- `Program`: academy program.
- `Cohort`: program-specific cohort.
- `Cohort.assignment_weight` and `Cohort.attendance_weight`: grade component weights that must total 100.
- `TeacherAssignment`: teacher-to-cohort relationship.
- `Application`: public student signup application.
- `Invitation`: secure expiring invitation for approved applicants, accepted to activate a student account.
- `Module`: cohort learning unit.
- `Lesson`: ordered submodule/lesson inside a module.
- `LessonImage`: uploaded image asset owned by a lesson and referenced from lesson content.
- `Resource`: ordered links attached to a lesson.
- `Assignment`: cohort assignment linked to a lesson and optionally to a resource.
- `Submission`: one student submission per assignment.
- `AttendanceSession`: one attendance roll per cohort date.
- `AttendanceRecord`: one student attendance status per attendance session.
- `Announcement`: program or cohort scoped message.
- `AnnouncementRead`: per-user read receipt for an announcement.
- `PlatformSettings`: singleton platform branding/theme settings.

Students belong to exactly one active cohort and can only access the program attached to that cohort. Teachers can be assigned to multiple cohorts.
Leaderboards are derived from graded submissions and respect `Cohort.leaderboard_visible`.
Student total grade is derived from graded assignment points and attendance credits using cohort grade weights.
