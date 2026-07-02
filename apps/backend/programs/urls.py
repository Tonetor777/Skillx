from rest_framework.routers import DefaultRouter

from programs.views import ProgramViewSet

router = DefaultRouter()
router.register("", ProgramViewSet, basename="program")

urlpatterns = router.urls
