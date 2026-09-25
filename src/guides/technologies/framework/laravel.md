# Laravel engineering guide

## Application architecture and Service Container

- Structure applications following clean architectural boundaries. Keep controllers thin: extract HTTP request data, authorize actions, delegate business transactions to dedicated action classes or domain services, and return typed responses or resource collections.
- Leverage Laravel's Service Container for dependency injection and interface binding. Register singletons, contextual bindings, and external service clients in dedicated Service Providers (`app/Providers/`) rather than polluting `AppServiceProvider`.
- Structure routes logically across `routes/web.php` for stateful cookie/session-based views and `routes/api.php` for stateless token-based API endpoints. Use route naming conventions (`route('users.show', $user)`) and Route Model Binding for clean, type-safe URL resolution.
- Manage configuration strictly via `config/*.php` files and the `.env` environment file. Access environment variables only within configuration files using `env()`; throughout application code, always use the `config('services.stripe.key')` helper to allow reliable configuration caching via `php artisan config:cache`.
- Encapsulate reusable domain logic in single-action classes (e.g., `CreateOrderAction`, `ProcessPaymentAction`) to promote testability and reusability between web, CLI console commands, and queued jobs.

## Eloquent ORM, migrations, and database hygiene

- Write explicit, reversible database migrations. Define appropriate column types, default values, and foreign key constraints with explicit cascading policies (`onDelete('cascade')` or `restrictOnDelete()`). Always add composite database indexes for frequent multi-column queries.
- Prevent mass-assignment vulnerabilities: explicitly define `$fillable` on all Eloquent models, or strictly use Form Requests and `$request->validated()` before mass-filling model attributes. Avoid blanket `$guarded = []`.
- Eliminate the N+1 query problem by eager loading relationships with `with(['author', 'comments.user'])` or enforcing strict loading prevention in local development environments via `Model::preventLazyLoading(!app()->isProduction())`.
- Wrap complex multi-table mutations inside `DB::transaction(function () { ... })` closures. Handle database deadlocks gracefully by providing retry counts (`DB::transaction($callback, 5)`).
- Offload time-consuming tasks (sending notifications, processing uploads, third-party API synchronization) to background queues using Laravel Jobs (`ShouldQueue`). Configure failed job handling, backoff intervals, and idempotency keys to ensure resilient job execution.

## Validation, security, and error handling

- Validate incoming HTTP requests using dedicated Form Request classes (`php artisan make:request StoreInvoiceRequest`). Encapsulate authorization checks in `authorize()` and input validation rules in `rules()`. Never trust unvalidated input arrays.
- Enforce authorization policies using Laravel Gates and Policy classes (`php artisan make:policy PostPolicy --model=Post`). Use `$this->authorize('update', $post)` in controllers or middleware to verify ownership and permissions.
- Defend against Cross-Site Request Forgery (CSRF) on all state-changing web routes via Laravel's built-in `VerifyCsrfToken` middleware. Ensure Single Page Applications (SPAs) use Laravel Sanctum's CSRF cookie-based authentication.
- Secure user credentials and API tokens: use bcrypt or Argon2 for password hashing, and implement Laravel Sanctum or Passport for robust API token management and revocation.
- Customize exception rendering in `app/Exceptions/Handler.php` or `bootstrap/app.php` (Laravel 11+). Sanitize production error responses to conceal raw SQL errors, stack traces, and internal file paths.

## Testing, performance, and maintenance

- Write automated tests using Pest PHP or PHPUnit. Leverage Laravel's built-in testing traits such as `RefreshDatabase` for isolated in-memory or transactional test runs without lingering test artifacts.
- Test both HTTP endpoint contracts using `$this->postJson(...)` and domain action classes in isolation. Mock external network services using `Http::fake()` and verify queued jobs using `Queue::fake()`.
- Optimize production deployments by running artisan caching commands: `php artisan config:cache`, `php artisan route:cache`, and `php artisan view:cache`.
- Utilize Laravel Horizon for real-time monitoring and throughput metrics of Redis-based queue workers.
- Log operational events using the Monolog-powered `Log` facade with structured JSON context fields (`Log::info('Order placed', ['order_id' => $order->id])`) to facilitate centralized log indexing and alerting.
