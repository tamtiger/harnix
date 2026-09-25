# PHP engineering guide

## Modern language standards, typing, and class design

- Target modern PHP versions (PHP 8.2 or PHP 8.3+). Always enable strict typing at the very top of every PHP file without exception: `declare(strict_types=1);`. Strict typing eliminates dangerous implicit type coercions and surfaces bugs at boundary calls.
- Leverage modern PHP expressive type system: union types (`int|float`), intersection types (`Countable&Traversable`), nullable types (`?string`), and the `never` return type for methods that always throw exceptions or terminate the script.
- Model immutable domain data using `readonly` classes (`readonly class Money { ... }`) or readonly properties. Take advantage of Constructor Property Promotion to eliminate redundant field assignments and boilerplate.
- Use native backed enums (`enum OrderStatus: string { case Pending = 'pending'; case Completed = 'completed'; }`) for fixed sets of domain values, status flags, and classification types instead of brittle string constants or class constants.
- Avoid legacy PHP anti-patterns: never use `eval()`, variable variables (`$$var`), `create_function()`, or global variables (`$GLOBALS`, `global $conn`). Keep global state out of application architectures.

## Architecture, Dependency Injection, and error hygiene

- Structure applications following PSR standards: PSR-4 for autoloading, PSR-7 / PSR-15 for HTTP message and middleware abstractions, PSR-11 for Dependency Injection containers, and PSR-3 for logging interfaces.
- Rely on Dependency Injection containers rather than Service Locators or static facade singletons for core business logic. Inject dependencies explicitly through class constructor parameters to allow effortless mocking and deterministic unit testing.
- Design domain exceptions as a structured hierarchy inheriting from `\DomainException` or custom base exception classes. Never catch broad `\Throwable` or `\Exception` unless logging an unhandled catastrophe at the top-level application kernel boundary.
- Convert PHP notices, warnings, and deprecations into exceptions in development and testing environments using custom error handlers (`set_error_handler`) to ensure no silent warnings escape into production.
- Manage configuration strictly via immutable configuration objects loaded from validated environment files (`.env`). Cache compiled configuration files during deployment to maximize production execution performance.

## Security, sanitization, and defensive programming

- Prevent SQL Injection: always use PHP Data Objects (PDO) with parameterized prepared statements (`$stmt = $pdo->prepare('SELECT ... WHERE id = :id'); $stmt->execute(['id' => $id]);`). Never concatenate or interpolate raw user inputs into SQL strings.
- Enforce secure credential management: hash user passwords using `password_hash($password, PASSWORD_BCRYPT, ['cost' => 12])` or Argon2id (`PASSWORD_ARGON2ID`). Always verify passwords using `password_verify()` to prevent timing attacks.
- Protect against Cross-Site Scripting (XSS): escape all dynamic output rendered into HTML templates using `htmlspecialchars($input, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')` or modern templating engines (Twig, Blade) that auto-escape by default.
- Defend against Cross-Site Request Forgery (CSRF): generate and validate cryptographically secure anti-CSRF tokens for all state-changing HTTP POST, PUT, PATCH, and DELETE requests.
- Prevent Remote Code Execution and Object Injection: never pass untrusted user data to `unserialize()`; use `json_decode()` or `json_validate()` (PHP 8.3+) for safe data parsing.

## Testing, static analysis, and performance

- Write comprehensive automated tests using Pest PHP or PHPUnit. Organize tests cleanly into Unit (pure logic tests with zero I/O) and Integration (testing database interactions and HTTP endpoints) suites.
- Use static analysis tools aggressively: run PHPStan or Psalm at strict analysis levels (level 8 or max) in CI/CD pipelines to catch type mismatches, dead code, and subtle nullability bugs before code reaches production.
- Optimize PHP runtime performance: enable and configure OPcache (`opcache.enable=1`, `opcache.validate_timestamps=0` in production) and JIT (Just-In-Time) compilation where appropriate.
- Manage long-running tasks, heavy report generation, and third-party API synchronization asynchronously using background queues (RabbitMQ, Redis) rather than blocking the synchronous PHP-FPM web request-response lifecycle.
- Implement structured logging with Monolog using JSON formatters. Redact sensitive credentials and include request correlation IDs to support distributed tracing across microservices.
