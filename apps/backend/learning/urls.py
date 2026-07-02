from rest_framework.routers import DefaultRouter

from learning.views import AssignmentViewSet, ResourceViewSet, WeekViewSet

router = DefaultRouter()
router.register("assignments", AssignmentViewSet, basename="assignment")
router.register("weeks", WeekViewSet, basename="week")
router.register("resources", ResourceViewSet, basename="resource")

urlpatterns = router.urls
