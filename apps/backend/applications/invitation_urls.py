from rest_framework.routers import DefaultRouter

from applications.views import InvitationViewSet

router = DefaultRouter()
router.register("", InvitationViewSet, basename="invitation")

urlpatterns = router.urls
