from django.urls import path

from dashboard.views import DashboardSummaryView, LeaderboardView, PlatformSettingsView

urlpatterns = [
    path("settings/", PlatformSettingsView.as_view(), name="platform-settings"),
    path("dashboard/summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("leaderboard/", LeaderboardView.as_view(), name="leaderboard"),
]
