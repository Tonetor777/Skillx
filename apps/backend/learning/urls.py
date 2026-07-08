from rest_framework.routers import DefaultRouter

from learning.views import AssignmentViewSet, LessonViewSet, ModuleViewSet, ResourceViewSet

router = DefaultRouter()
router.register("assignments", AssignmentViewSet, basename="assignment")
router.register("modules", ModuleViewSet, basename="module")
router.register("lessons", LessonViewSet, basename="lesson")
router.register("resources", ResourceViewSet, basename="resource")

urlpatterns = router.urls
