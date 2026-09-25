# Angular engineering guide

## Architecture and standalone component design

- Adopt modern Standalone Components, Directives, and Pipes (`standalone: true`) as the default architecture for modern Angular applications. Avoid declaring unnecessary `NgModule` containers unless maintaining legacy codebases.
- Maintain a strict directory hierarchy: separate core singleton services (`core/`), shared reusable presentation UI components (`shared/`), and domain-specific feature modules (`features/`).
- Adopt Angular Signals (`signal()`, `computed()`, `effect()`) for fine-grained, reactive state management and modern zone-less or reduced-zone change detection. Use signals for synchronous component-local state and derived data representations.
- Structure smart (container) and dumb (presentational) components intentionally. Dumb components should communicate purely via signal inputs (`input()`), output events (`output()`), and maintain zero knowledge of external HTTP services or routing dependencies.
- Configure `ChangeDetectionStrategy.OnPush` across all components to eliminate redundant change detection passes and improve application rendering performance.

## Routing, HTTP, and data handling

- Implement lazy loading for feature routes using `loadComponent: () => import('./feature.component')` or `loadChildren: () => import('./feature.routes')`. Keep the initial bundle slim to guarantee fast First Contentful Paint (FCP).
- Protect routes and control navigation flows using functional route guards (`canActivate: [authGuard]`, `canDeactivate: [unsavedChangesGuard]`) instead of deprecated class-based guard implementations.
- Handle HTTP communication with Angular's `HttpClient` configured via `provideHttpClient()`. Use functional HTTP interceptors (`withInterceptors([authInterceptor, loggingInterceptor])`) for token injection, error handling, and header normalization.
- Manage asynchronous streams using RxJS deliberately. Unsubscribe from manual subscriptions using `takeUntilDestroyed()`, `take(1)`, or prefer binding directly in templates using the `async` pipe or converting to signals via `toSignal()`.
- Avoid memory leaks: never create unbounded subscriptions in component lifecycles or service instances without explicit teardown logic.

## Forms, validation, and security

- Prefer Reactive Forms (`ReactiveFormsModule`) over template-driven forms for complex enterprise workflows. Define type-safe form groups (`FormGroup`, `FormControl`, `FormBuilder`) to guarantee compile-time type safety across form controls.
- Enforce validation rules on form controls (`Validators.required`, `Validators.email`, custom validator functions). Show contextual, accessible error feedback only when a control is touched or dirty (`control.touched && control.invalid`).
- Protect against Cross-Site Scripting (XSS) by relying on Angular's built-in DOM sanitization. Avoid bypassing security via `DomSanitizer.bypassSecurityTrustHtml` unless input has been processed by a rigorous backend or client-side sanitizer like DOMPurify.
- Mitigate Cross-Site Request Forgery (CSRF) by enabling `withXsrfConfiguration` in HTTP client providers. Ensure cookie-based sessions send and validate matching anti-CSRF request headers.
- Never store sensitive user tokens, secrets, or encryption keys in unencrypted browser `localStorage` or `sessionStorage` where they are vulnerable to XSS extraction; use secure `HttpOnly` cookies where possible.

## Performance, testing, and maintenance

- Optimize list rendering in templates using the modern control flow `@for` syntax with an explicit `@for (item of items; track item.id)` track expression. Never omit the `track` expression.
- Use the `@defer` block for deferred template loading of heavy components, images, or third-party widgets until specific conditions are met (e.g., `@defer (on viewport)`).
- Write focused unit tests for components, services, and pipes using Vitest or Jest with the Angular testing utilities (`TestBed.configureTestingModule`). Test user interactions and observable outputs rather than internal private component state.
- Mock HTTP backend requests in integration tests using `HttpTestingController` from `@angular/common/http/testing` to assert exact URL calls, query parameters, and error status simulations.
- Enforce strict TypeScript compilation (`"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`) and configure ESLint with `@angular-eslint` to enforce architectural conventions and template accessibility (a11y) rules.
