from rest_framework.routers import DefaultRouter

from attendance.views import AttendanceSessionViewSet

router = DefaultRouter()
router.register("", AttendanceSessionViewSet, basename="attendance-session")

urlpatterns = router.urls
