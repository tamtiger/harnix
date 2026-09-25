# CodeIgniter engineering guide

## Architecture, MVC patterns, and application structure

- Standardize on modern CodeIgniter 4 (CI4). Structure applications strictly within the `app/` directory: Controllers (`Controllers/`), Models (`Models/`), Entities (`Entities/`), Database Migrations (`Database/Migrations/`), and Filters (`Filters/`). Keep the web document root pointing strictly to `public/` to prevent exposing framework internals or environment files.
- Keep Controllers thin: extract HTTP request data, invoke model methods or service classes, and return typed `ResponseInterface` instances (JSON or view representations). Avoid writing complex business algorithms or raw database queries directly inside controller methods.
- Model domain data using CodeIgniter Entities (`CodeIgniter\Entity\Entity`). Entities provide type-casting, mutation tracking, and encapsulation for database records rather than relying on untyped generic arrays.
- Configure routes explicitly in `app/Config/Routes.php` using `$routes->group()` with clear URL prefixes, controller namespaces, and HTTP verbs. Disable auto-routing (`$routes->setAutoRoute(false)`) to prevent unintended controller method execution and parameter tampering vulnerabilities.
- Manage environment configuration via `.env` files. Access configuration variables using the `env()` helper exclusively in `app/Config/*.php` configuration classes, and inject typed configuration instances into controllers and models.

## Database, Query Builder, and migrations

- Write reversible database migrations using `CodeIgniter\Database\Migration`. Always define primary keys, appropriate column types, and foreign key constraints with explicit cascade rules. Never alter live database schemas manually without tracked migrations.
- Use CodeIgniter's Model class (`CodeIgniter\Model`) with `$allowedFields` explicitly defined for mass-assignment protection. Never disable `$allowedFields` or permit unwhitelisted input arrays to be passed directly into `$model->insert()` or `$model->update()`.
- Use the Query Builder for constructing parameterized queries (`$builder->where('id', $id)->get()`). Query Builder automatically escapes identifiers and parameters, preventing SQL injection vulnerabilities.
- For complex relational data, implement explicit joins or entity repositories to prevent N+1 query performance degradation.
- Manage database transactions explicitly: wrap multi-step database mutations within `$db->transStart()` and `$db->transComplete()` blocks to guarantee atomic data consistency during business operations.

## Filters, security, and error handling

- Implement request lifecycle hooks and middleware using CodeIgniter Filters (`CodeIgniter\Filters\FilterInterface`). Apply authentication, authorization, CORS, and rate-limiting filters selectively to route groups rather than globally to the entire application.
- Enforce Cross-Site Request Forgery (CSRF) protection: enable CSRF filter (`$routes->add('...', '...', ['filter' => 'csrf'])`) or global CSRF protection in `app/Config/Filters.php`. Ensure forms include `<?= csrf_field() ?>` and AJAX requests supply the `X-CSRF-TOKEN` header.
- Prevent Cross-Site Scripting (XSS): escape all dynamic view outputs using the `esc()` helper (`esc($variable, 'html')` or `esc($variable, 'attr')`). Never output unescaped user-generated text directly into HTML templates.
- Secure user credentials: use `password_hash()` with bcrypt or Argon2 for password hashing, and verify credentials using `password_verify()`. Never implement custom hashing schemes.
- Handle exceptions predictably: configure `CI_ENVIRONMENT = production` in production environments to suppress detailed exception traces and raw SQL errors from public view, and customize error view templates under `app/Views/errors/` to return clean user-facing error pages.

## Testing, performance, and maintenance

- Write automated tests using PHPUnit with CodeIgniter's testing traits: use `CodeIgniter\Test\CIUnitTestCase`, `CodeIgniter\Test\DatabaseTestTrait` for isolated database testing with transactions or migrations, and `CodeIgniter\Test\FeatureTestTrait` for end-to-end HTTP route testing.
- Test endpoint responses using `$this->get(...)` and `$this->post(...)`: assert HTTP response status codes, JSON payload structures (`$result->assertJSONFragment(...)`), and proper session flash messages.
- Optimize production performance: enable web page output caching (`$this->cachePage(300)`) for read-heavy static public pages, and utilize CodeIgniter's Cache service (backed by Redis or Memcached) for caching complex database query results.
- Implement structured application logging using the `log_message()` function. Ensure sensitive user passwords, authorization tokens, and payment details are sanitized before writing log entries to `writable/logs/`.
- Maintain clean CLI task automation: implement custom CLI commands inheriting from `CodeIgniter\CLI\BaseCommand` for database seeding, cron workers, and data cleanup tasks.
