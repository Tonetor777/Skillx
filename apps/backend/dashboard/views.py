from django.db.models import Avg, Count, Q, Sum
from drf_spectacular.utils import OpenApiTypes, extend_schema, inline_serializer
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework import serializers
from rest_framework.views import APIView

from accounts.choices import UserRole
from accounts.permissions import IsActiveUser, IsSuperAdmin
from applications.models import Application
from announcements.models import Announcement
from cohorts.models import Cohort
from dashboard.models import PlatformSettings
from dashboard.serializers import PlatformSettingsSerializer
from learning.models import Assignment, Module
from programs.models import Program
from submissions.models import Submission


class PlatformSettingsView(APIView):
    permission_classes = [IsActiveUser]
    serializer_class = PlatformSettingsSerializer

    @extend_schema(responses=PlatformSettingsSerializer)
    def get(self, request):
        serializer = PlatformSettingsSerializer(PlatformSettings.load())
        return Response(serializer.data)

    @extend_schema(request=PlatformSettingsSerializer, responses=PlatformSettingsSerializer)
    def post(self, request):
        self.check_permissions(request)
        settings = PlatformSettings.load()
        serializer = PlatformSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @extend_schema(request=PlatformSettingsSerializer, responses=PlatformSettingsSerializer)
    def patch(self, request):
        return self.post(request)

    def get_permissions(self):
        if self.request and self.request.method in {"POST", "PATCH"}:
            return [IsSuperAdmin()]
        return super().get_permissions()


class LeaderboardView(APIView):
    permission_classes = [IsActiveUser]

    @extend_schema(
        responses=inline_serializer(
            name="LeaderboardResponse",
            fields={
                "cohort_id": serializers.CharField(),
                "cohort_name": serializers.CharField(),
                "results": serializers.ListField(child=serializers.DictField()),
            },
        )
    )
    def get(self, request):
        cohort_id = request.query_params.get("cohort_id") or request.user.cohort_id
        if not cohort_id:
            raise ValidationError({"cohort_id": "A cohort is required."})
        try:
            cohort = Cohort.objects.get(id=cohort_id)
        except Cohort.DoesNotExist as exc:
            raise ValidationError({"cohort_id": "Cohort does not exist."}) from exc
        if request.user.role == UserRole.STUDENT and request.user.cohort_id != cohort.id:
            raise PermissionDenied("Students can only view their cohort leaderboard.")
        if request.user.role == UserRole.TEACHER and not cohort.teacher_assignments.filter(teacher=request.user).exists():
            raise PermissionDenied("Teachers can only view assigned cohort leaderboards.")
        if not cohort.leaderboard_visible and request.user.role not in {UserRole.ADMIN, UserRole.SUPER_ADMIN}:
            raise PermissionDenied("Leaderboard is hidden for this cohort.")

        rows = (
            Submission.objects.filter(assignment__cohort=cohort, score__isnull=False)
            .values("student_id", "student__first_name", "student__last_name", "student__email")
            .annotate(total_score=Sum("score"), average_score=Avg("score"), graded_count=Count("id"))
            .order_by("-total_score", "-average_score", "student__email")
        )
        results = []
        for index, row in enumerate(rows, start=1):
            name = f"{row['student__first_name']} {row['student__last_name']}".strip() or row["student__email"]
            results.append(
                {
                    "rank": index,
                    "student_id": str(row["student_id"]),
                    "student_name": name,
                    "total_score": float(row["total_score"] or 0),
                    "average_score": float(row["average_score"] or 0),
                    "graded_count": row["graded_count"],
                }
            )
        return Response({"cohort_id": str(cohort.id), "cohort_name": cohort.name, "results": results})


class DashboardSummaryView(APIView):
    permission_classes = [IsActiveUser]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        user = request.user
        if user.role == UserRole.STUDENT:
            submissions = Submission.objects.filter(student=user)
            return Response(
                {
                    "role": "student",
                    "progress": {
                        "assignments_total": Assignment.objects.filter(cohort_id=user.cohort_id).count(),
                        "submissions_total": submissions.count(),
                        "graded_total": submissions.filter(score__isnull=False).count(),
                    },
                    "current_module": Module.objects.filter(cohort_id=user.cohort_id, status="PUBLISHED").order_by("-module_number").values("module_number", "title").first(),
                    "grades": {"average": submissions.filter(score__isnull=False).aggregate(value=Avg("score"))["value"] or 0},
                    "announcements": Announcement.objects.filter(Q(cohort_id=user.cohort_id) | Q(program_id=user.cohort.program_id if user.cohort_id else None)).count(),
                }
            )
        if user.role == UserRole.TEACHER:
            cohorts = Cohort.objects.filter(teacher_assignments__teacher=user).distinct()
            return Response(
                {
                    "role": "teacher",
                    "assigned_cohorts": cohorts.count(),
                    "pending_grading": Submission.objects.filter(assignment__cohort__in=cohorts, score__isnull=True).count(),
                    "analytics": {
                        "assignments_total": Assignment.objects.filter(cohort__in=cohorts).count(),
                        "students_total": sum(cohort.students.count() for cohort in cohorts),
                    },
                }
            )
        return Response(
            {
                "role": user.role.lower(),
                "applications": {
                    "pending": Application.objects.filter(status="PENDING").count(),
                    "approved": Application.objects.filter(status="APPROVED").count(),
                    "rejected": Application.objects.filter(status="REJECTED").count(),
                },
                "programs": Program.objects.count(),
                "cohorts": Cohort.objects.count(),
                "reports": {
                    "students": Cohort.objects.aggregate(total=Count("students"))["total"],
                    "submissions": Submission.objects.count(),
                },
            }
        )
