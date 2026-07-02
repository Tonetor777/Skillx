from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.choices import UserRole, UserStatus
from announcements.models import Announcement
from cohorts.models import Cohort, CohortStatus, TeacherAssignment, TeacherAssignmentRole
from dashboard.models import PlatformSettings
from learning.models import Assignment, Resource, Week, WeekStatus
from programs.models import Program, ProgramLevel, ProgramStatus


class Command(BaseCommand):
    help = "Seed deterministic local development data for the Skilix dashboard."

    def handle(self, *args, **options):
        User = get_user_model()

        def upsert_user(email, first_name, last_name, role, *, cohort=None, staff=False, superuser=False):
            user, _ = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "name": f"{first_name} {last_name}",
                    "role": role,
                    "status": UserStatus.ACTIVE,
                    "is_staff": staff,
                    "is_superuser": superuser,
                    "cohort": cohort,
                },
            )
            user.username = email
            user.first_name = first_name
            user.last_name = last_name
            user.name = f"{first_name} {last_name}"
            user.role = role
            user.status = UserStatus.ACTIVE
            user.is_staff = staff
            user.is_superuser = superuser
            if cohort is not None:
                user.cohort = cohort
            user.set_password("password")
            user.save()
            return user

        program, _ = Program.objects.update_or_create(
            slug="full-stack-react-engineering",
            defaults={
                "title": "Full-Stack React Engineering",
                "description": "Build production-ready web applications with React, Django, APIs, and deployment workflows.",
                "syllabus": [
                    {
                        "number": 1,
                        "title": "Foundations",
                        "objective": "Set up the development environment and review modern web architecture.",
                        "resources": [
                            {
                                "id": "seed-res-1",
                                "title": "Welcome Playbook",
                                "type": "document",
                                "url": "https://example.com/welcome",
                            }
                        ],
                    },
                    {
                        "number": 2,
                        "title": "API Integration",
                        "objective": "Connect frontend data flows to authenticated backend APIs.",
                        "resources": [],
                    },
                ],
                "duration_weeks": 12,
                "level": ProgramLevel.INTERMEDIATE,
                "status": ProgramStatus.ACTIVE,
            },
        )

        today = timezone.localdate()
        cohort, _ = Cohort.objects.update_or_create(
            program=program,
            name="July 2026",
            defaults={
                "start_date": today,
                "end_date": today + timedelta(weeks=12),
                "duration_weeks": 12,
                "current_week": 1,
                "leaderboard_visible": True,
                "status": CohortStatus.ACTIVE,
            },
        )

        superadmin = upsert_user("superadmin@skilix.com", "Sarah", "Connor", UserRole.SUPER_ADMIN, staff=True, superuser=True)
        admin = upsert_user("admin@skilix.com", "John", "Doe", UserRole.ADMIN, staff=True)
        teacher = upsert_user("teacher@skilix.com", "David", "Malan", UserRole.TEACHER, staff=True)
        student = upsert_user("student@skilix.com", "Alex", "Mercer", UserRole.STUDENT, cohort=cohort)

        TeacherAssignment.objects.get_or_create(teacher=teacher, cohort=cohort, role=TeacherAssignmentRole.LEAD)

        week, _ = Week.objects.update_or_create(
            cohort=cohort,
            week_number=1,
            defaults={
                "title": "Foundations",
                "objectives": "Set up tooling, review cohort expectations, and submit a first project link.",
                "notes": "",
                "assignment": "Submit your project repository and deployment URL.",
                "recording": "",
                "status": WeekStatus.PUBLISHED,
                "publish_date": timezone.now(),
                "created_by": teacher,
                "published_by": teacher,
            },
        )
        Resource.objects.update_or_create(
            week=week,
            title="Welcome Playbook",
            defaults={"url": "https://example.com/welcome", "order": 1},
        )
        Assignment.objects.update_or_create(
            cohort=cohort,
            week_number=1,
            title="Build and Deploy a Full-Stack React App",
            defaults={
                "week": week,
                "description": "Submit a repository and deployment link for a small full-stack application.",
                "max_points": 100,
                "due_date": timezone.now() + timedelta(days=7),
                "is_locked": False,
                "created_by": teacher,
            },
        )
        Announcement.objects.get_or_create(
            title="Welcome to Skilix",
            message="Your cohort workspace is ready. Check assignments and announcements throughout the week.",
            cohort=cohort,
            defaults={"created_by": admin},
        )
        PlatformSettings.objects.update_or_create(pk=1, defaults={"branding_name": "Skilix LMS", "theme": "zinc"})

        self.stdout.write(self.style.SUCCESS("Seeded Skilix development data."))
