# Django guide

## Verify

```text
python manage.py check --deploy
python manage.py makemigrations --check --dry-run
python manage.py test
pytest
ruff check .
```

## Constraints

- Read SECRET_KEY, DEBUG, ALLOWED_HOSTS and DB credentials from the environment; never commit them.
- Set SESSION_COOKIE_SECURE, CSRF_COOKIE_SECURE and SECURE_SSL_REDIRECT in production; `check --deploy` must report no warnings.
- Commit every generated migration; never edit an applied migration, add a new one.
- Use `select_related`/`prefetch_related` for relations read in loops; assert query counts with `assertNumQueries`.
- Wrap multi-step writes in `transaction.atomic()`; use `F()` and `select_for_update()` for concurrent updates.
- Never use `mark_safe`, `|safe`, `.raw()` or `.extra()` with user input; rely on template auto-escaping and ORM parameters.
- For rich user HTML use a maintained sanitizer such as `nh3`; never `bleach` (unmaintained).
- Use `reverse()`/`reverse_lazy()` with `app_name` namespaces, never hardcoded URLs.
- DRF: declare explicit serializer `fields` (never `__all__`) and set permission_classes and pagination.

## Common mistakes

- N+1 queries from serializers or templates touching related objects.
- `DEBUG = True` or wildcard ALLOWED_HOSTS in production.
- `@csrf_exempt` on session-authenticated views.
- Business logic in signals or views instead of services/model methods.
- Importing the settings module directly instead of `django.conf.settings`.
