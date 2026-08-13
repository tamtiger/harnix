# CodeIgniter engineering guide

## Request and application boundaries

- Keep controllers thin: obtain and validate request input, authorize the operation, call an application/domain service, and return a response. Do not place persistence rules or long workflows in a controller.
- Use routes and filters deliberately. Authentication filters establish identity; authorization must still decide whether the current actor can access the requested resource.
- Prefer explicit dependency injection/services configured by the application over direct use of mutable global request/session state in domain logic. Pass only the request-derived values a use case needs.
- Return a consistent error shape for validation, authorization, not-found, and unexpected failures. Do not reveal stack traces, SQL, filesystem paths, or production configuration.

## Models and database work

- Use models/query builder or PDO parameter binding for values. Whitelist dynamic identifiers such as sort fields; placeholders cannot safely parameterize SQL structure.
- Configure model `allowedFields`, casts, validation rules, callbacks, soft-delete, and timestamps intentionally. Never mass-assign a request payload to a model without an explicit allow-list.
- Understand partial update validation: validating only submitted fields can allow rules that rely on other fields to be skipped. Add service-level/domain validation where the invariant spans the complete record.
- Keep transactions around a business operation and test rollback behavior. Avoid database calls hidden inside views or response formatting.

## Output and security

- Escape untrusted output for the rendered context and let templates use their escaping mechanism by default. Validate uploads, normalize paths under an intended root, and use server-controlled filenames.
- Set secure session/cookie behavior through the framework configuration and protect state-changing endpoints with the project's chosen CSRF approach.
- Keep secrets and environment-specific values in supported configuration. Do not commit `.env` secrets or log complete request payloads.

## Testing

- Use CodeIgniter test helpers and isolated fixtures for controller, model, database, and service tests. Reset database/session state between tests.
- Assert response status/body, authorization, validation, and observable persistence outcomes. Avoid tests that depend on mutation order of global request objects.
