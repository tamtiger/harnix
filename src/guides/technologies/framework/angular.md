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
- Use signals (`signal`, `computed`, `input()`, `output()`) for local state and `inject()` for dependencies; derive with `computed`, never sync signals through `effect()`.
- Use built-in control flow (`@if`, `@for` with `track`, `@switch`) instead of `*ngIf`/`*ngFor` in new templates.
- Unsubscribe with `takeUntilDestroyed()` or the `async` pipe; never leave manual subscriptions open.
- Keep `strict: true` in tsconfig and `strictTemplates: true` in `angularCompilerOptions`.
- Lazy-load routes with `loadComponent` or `loadChildren`.
- Use typed reactive forms (`FormControl<T>`) and functional guards/interceptors (`CanActivateFn`, `HttpInterceptorFn`).
- Never call `bypassSecurityTrust*` on untrusted input; keep real secrets out of `environment.ts` (it ships to the browser).
- Guard authenticated or role-restricted routes with functional guards (`canMatch` also blocks the lazy chunk); hiding UI is not authorization.

## Common mistakes

- Calling methods in templates instead of using `computed` or pure pipes.
- Nested `subscribe` calls instead of `switchMap` (search), `exhaustMap` (submit) or `combineLatest`; streams without `catchError` die silently.
- Mutating `@Input` objects under OnPush so the view does not update.
- Touching `window`, `document` or `localStorage` in SSR-rendered code instead of `DOCUMENT`/`isPlatformBrowser`.
- Providing a service in a component when it should be `providedIn: 'root'`.
- Assigning signal inputs directly in tests instead of `fixture.componentRef.setInput()`.
