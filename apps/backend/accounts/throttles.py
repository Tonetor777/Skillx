from rest_framework.throttling import ScopedRateThrottle


class SensitiveAuthThrottle(ScopedRateThrottle):
    scope = "auth"
