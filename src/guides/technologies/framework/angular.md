# Angular guide

## Verify

```text
tsc --noEmit -p tsconfig.app.json
ng lint
ng test --watch=false
ng build
```

## Constraints

- Use standalone components, directives and pipes; do not add new NgModules.
- Set `changeDetection: ChangeDetectionStrategy.OnPush` on components.
- Use signals (`signal`, `computed`, `input()`, `output()`) for local state and `inject()` for dependencies.
- Use built-in control flow (`@if`, `@for` with `track`, `@switch`) instead of `*ngIf`/`*ngFor` in new templates.
- Unsubscribe with `takeUntilDestroyed()` or the `async` pipe; never leave manual subscriptions open.
- Keep `strict: true` in tsconfig and `strictTemplates: true` in `angularCompilerOptions`.
- Lazy-load routes with `loadComponent` or `loadChildren`.
- Use typed reactive forms (`FormControl<T>`) and functional guards/interceptors (`CanActivateFn`, `HttpInterceptorFn`).
- Never call `bypassSecurityTrust*` on untrusted input.

## Common mistakes

- Calling methods in templates instead of using `computed` or pure pipes.
- Nested `subscribe` calls instead of `switchMap`/`combineLatest`.
- Mutating `@Input` objects under OnPush so the view does not update.
- Missing `track` expression in `@for`.
- Providing a service in a component when it should be `providedIn: 'root'`.
