from rest_framework.routers import DefaultRouter

from cohorts.views import TeacherAssignmentViewSet

router = DefaultRouter()
router.register("", TeacherAssignmentViewSet, basename="teacher-assignment")

urlpatterns = router.urls
