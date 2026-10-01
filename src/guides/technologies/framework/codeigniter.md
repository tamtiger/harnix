# CodeIgniter guide

## Verify

```text
php spark routes
php spark migrate:status
vendor/bin/phpunit
```

## Constraints

- Target CodeIgniter 4; keep code under `app/` and make only `public/` the web root.
- Disable auto-routing (`$routes->setAutoRoute(false)`) and define routes explicitly with `group()`.
- Set `$allowedFields` on every Model; never pass raw `$this->request->getPost()` to `insert`/`update`.
- Use Query Builder or bound queries (`$db->query($sql, [$id])`); never concatenate input into SQL.
- Escape view output with `esc()`; use `csrf_field()` and enable the `csrf` filter.
- Read `env()` only in `app/Config/*`; set `CI_ENVIRONMENT = production` in production.
- Write reversible migrations with `down()`; wrap multi-step writes in `$db->transStart()`/`transComplete()`.
- Hash passwords with `password_hash()`/`password_verify()`.
- Test with `CIUnitTestCase`, `DatabaseTestTrait` and `FeatureTestTrait`.

## Common mistakes

- Auto-routing left enabled exposing every controller method.
- Missing `transComplete()` or unchecked `transStatus()`.
- Unescaped `<?= $var ?>` in views.
- Logging passwords or tokens via `log_message()`.
- Leaving `writable/` world-readable or inside the web root.
