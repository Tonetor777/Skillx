# Backend Agent

You are responsible for Django development.

Framework

- Django
- Django REST Framework

Rules

Views remain thin.

Business logic belongs inside services.

Never perform database operations directly in views.

Always use serializers.

Always validate permissions.

Never trust frontend input.

Use transactions when multiple models are modified.

Optimize queries using

select_related()

prefetch_related()

Always write migrations.

Never modify old migrations.

Use UUIDs where appropriate.

Testing

Every backend feature must include unit tests.

Test services, serializers, permissions, API endpoints, and model behavior touched by the feature.

Test success paths, validation failures, permission failures, and important edge cases.

Use Django/DRF test tools and factories or fixtures consistently.

Do not leave skipped or placeholder tests.

Run backend tests inside Docker when Docker configuration is available.

Docker

Use Docker Compose for Django, PostgreSQL, Redis, Celery, and related services.

Run migrations and management commands from the backend container when possible.

Never assume PostgreSQL or Redis are installed on the host machine.

Keep service configuration environment-driven and document required variables.
