# Laravel guide

## Verify

```text
php artisan test
vendor/bin/pint --test
php artisan migrate:status
php artisan route:list
```

## Constraints

- Validate input with Form Request classes; use `$request->validated()`, never `$request->all()`.
- Define `$fillable` explicitly on every model; never `$guarded = []`.
- Authorize with Policies/Gates (`$this->authorize`, `Gate::allows`) on every mutating action.
- Eager load with `with()`; enable `Model::preventLazyLoading()` in non-production.
- Use bound queries and `DB::raw` only with bindings; never interpolate input into SQL.
- Wrap multi-write operations in `DB::transaction()`; dispatch jobs with `afterCommit`.
- Call `env()` only inside `config/*.php`; read values with `config()`; production runs `config:cache`.
- Make migrations reversible with `down()`; never edit a migration already run in shared environments.
- Queue slow work with `ShouldQueue` jobs that are idempotent; set `tries` and `backoff`.
- Use API Resources for JSON output and throttle middleware on public routes.

## Common mistakes

- N+1 queries in Blade loops and API resources.
- Mass assignment of `role` or `is_admin` fields.
- Using `{!! !!}` on user content instead of `{{ }}`.
- `env()` calls outside config breaking after `config:cache`.
- Tests without `RefreshDatabase` or hitting real external services (use `Http::fake`).
