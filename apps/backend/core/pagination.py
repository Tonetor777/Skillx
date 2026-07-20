from django.conf import settings
from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    page_size = getattr(settings, "DRF_PAGE_SIZE", 50)
    page_size_query_param = "page_size"
    max_page_size = getattr(settings, "DRF_MAX_PAGE_SIZE", 100)
