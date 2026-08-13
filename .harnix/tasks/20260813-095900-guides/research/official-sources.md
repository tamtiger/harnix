# Official-source research: guide expansion

Research date: 2026-08-13. The guides are Harnix-authored summaries and operational recommendations, not copied source text. Sources below establish the concepts and framework behavior used in the rewrite.

## General language and runtime guidance

| Scope | Primary official sources | Applied themes |
|---|---|---|
| C# / .NET | [C# coding conventions](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions) | Readability, consistent formatting, public contracts; supplemented with established .NET async, DI, options, ORM, and hosted-service conventions. |
| Go | [Effective Go](https://go.dev/doc/effective_go), [handling errors](https://go.dev/doc/tutorial/handle-errors), [package testing](https://pkg.go.dev/testing) | Explicit error returns, contextual errors, resource lifetime, package tests. |
| Java | [Java streams and resource handling](https://dev.java/learn/api/streams/creating/), [try-with-resources](https://dev.java/learn/java-io/reading-writing/common-operations/) | Close resources deterministically, clear exception/transaction boundaries. |
| JavaScript | [MDN strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode) | Module/strict-mode behavior, explicit asynchronous and runtime-data boundaries. |
| TypeScript | [module compiler choices](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options), [module theory](https://www.typescriptlang.org/docs/handbook/modules/theory.html), [TSConfig strictness](https://www.typescriptlang.org/tsconfig/) | Runtime/module alignment, strict compiler policy, `unknown` at untrusted boundaries. |
| PHP | [password_hash](https://www.php.net/manual/en/function.password-hash.php), [PDO::prepare](https://www.php.net/pdo.prepare.php) | Platform password APIs and parameter binding. |
| Python | [Python documentation](https://docs.python.org/3/) | Type-hinting, context managers, exception boundaries, filesystem and packaging practices. |

## Framework and UI guidance

| Scope | Primary official sources | Applied themes |
|---|---|---|
| ABP | [DDD layers](https://abp.io/docs/latest/framework/architecture/domain-driven-design), [application services](https://abp.io/docs/latest/framework/architecture/domain-driven-design/application-services), [domain-service conventions](https://abp.io/docs/latest/framework/architecture/best-practices/domain-services) | Layer ownership, DTO/application-service boundaries, domain operations, multi-tenancy/data filter safeguards. |
| NestJS | [validation](https://docs.nestjs.com/techniques/validation), [configuration](https://docs.nestjs.com/techniques/configuration), [testing](https://docs.nestjs.com/fundamentals/testing) | Validation pipes, modules/providers, typed configuration, observable test boundaries. |
| Spring Boot | [reference documentation](https://docs.spring.io/spring-boot/reference/), [production-ready features](https://docs.spring.io/spring-boot/reference/actuator/index.html), [production packaging](https://docs.spring.io/spring-boot/reference/using/packaging-for-production.html) | Externalized configuration, validation/security, transaction/persistence decisions, health/metrics. |
| CodeIgniter | [model validation](https://codeigniter.com/user_guide/models/model.html), [database testing](https://codeigniter.com/user_guide/testing/database.html) | Safe model validation and partial-update implications, database test isolation. |
| React web | [component purity](https://react.dev/learn/keeping-components-pure), [Rules of React](https://react.dev/reference/rules) | Pure render phase, immutable props/state, effects outside render, user-visible test behavior. |
| Vue | [props and one-way flow](https://vuejs.org/guide/components/props), [component events](https://vuejs.org/guide/components/events), [performance](https://vuejs.org/guide/best-practices/performance), [testing](https://vuejs.org/guide/scaling-up/testing.html) | Props/events contract, ownership of state, measured performance, test observable component behavior. |

## Content decisions

- Every guide uses the same four-layer decision model where relevant: contract/ownership, boundaries/security, lifecycle/I/O, testing/operations.
- Language guides intentionally avoid framework-specific instructions. Technology guides only add framework/runtime concerns; they do not restate language syntax/style rules.
- Recommendations are deliberately conditional where product context matters: use the repository's existing formatter, test runner, ORM, framework pattern, and deployment model rather than requiring a new stack.
- No upstream prose, code sample, license-sensitive template, or external dependency was copied into `src/guides`.
