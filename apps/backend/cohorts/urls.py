from rest_framework.routers import DefaultRouter

from cohorts.views import CohortViewSet

router = DefaultRouter()
router.register("", CohortViewSet, basename="cohort")

urlpatterns = router.urls
