# PHP guide

## Verify

```text
composer validate --strict
vendor/bin/phpunit
vendor/bin/phpstan analyse
composer audit
```

## Constraints

- Start every file with `declare(strict_types=1);`.
- Never use `eval()`, `$$var`, `global` or `$GLOBALS`.
- Never pass untrusted data to `unserialize()`; use `json_decode($s, flags: JSON_THROW_ON_ERROR)`.
- Use PDO prepared statements with bound parameters; never concatenate input into SQL.
- Hash passwords with `password_hash()` (`PASSWORD_ARGON2ID` or `PASSWORD_BCRYPT`) and check with `password_verify()`.
- Escape HTML output with `htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')` or an auto-escaping template engine.
- Require a CSRF token on every POST, PUT, PATCH and DELETE and call `session_regenerate_id(true)` after login or privilege change.
- Use `readonly` properties and backed `enum` instead of mutable state and string constants.
- Inject dependencies through constructors (PSR-11); no static service locators.
- Catch specific exceptions; catch `\Throwable` only at the top-level kernel.

## Common mistakes

- Comparing hashes or tokens with `==` instead of `hash_equals()`.
- Calling `in_array()` without the strict `true` argument.
- Leaving `opcache.validate_timestamps=1` in production.
- Committing `.env` files.
- Running PHPStan below level 8 without a baseline.
- Mass-assigning request input to ORM models without a writable-field allowlist.
