# Vue engineering guide

## Architecture, Single-File Components (SFC), and Composition API

- Standardize on Vue 3 using the Composition API with `<script setup lang="ts">`. Avoid the legacy Options API for new application code; the Composition API provides superior TypeScript type inference, better logic colocation, and effortless code reuse via custom composables.
- Structure applications following feature-driven modularity: colocate components, composables, stores, and tests within feature folders (`src/features/<feature>/`).
- Keep components focused and modular: separate smart container components (handling data fetching, routing, and store interactions) from dumb presentational components (purely accepting typed props and emitting events).
- Define component contracts strictly: use TypeScript type-based macro declarations for props and emits: `defineProps<{ id: string; count?: number }>()` and `defineEmits<{ (e: 'change', value: string): void }>()`. Use `withDefaults()` to supply sensible fallback defaults for optional props.
- Keep template expressions concise and readable: avoid embedding complex multi-line JavaScript logic or nested ternary operators directly inside template interpolations (`{{ ... }}`). Extract complex logic into typed `computed()` properties.

## Reactivity system, state management, and composables

- Master Vue 3's reactivity primitives: use `ref()` as the default primitive for state values, primitives, and objects; reserve `reactive()` for complex state objects that require deeply reactive property access without `.value`.
- Use `computed()` for all derived state calculations. Ensure computed getters are strictly pure functions with zero side effects (never mutate state or trigger asynchronous network calls inside a computed getter).
- Control asynchronous side effects using `watch()` and `watchEffect()`. Always specify explicit dependencies in `watch(() => state.id, (newId) => { ... })` rather than writing unbounded `watchEffect` listeners that trigger unexpectedly on unintentional property reads. Clean up timers and event listeners inside `onWatcherCleanup()` or `onUnmounted()`.
- Manage global client state using Pinia (`defineStore`). Structure Pinia stores into modular, domain-specific stores; avoid creating one giant monolithic store. Keep actions focused on async business workflows and getters on derived state.
- Package reusable logic into custom composable functions (`useUserSession()`, `usePagination()`). Follow standard naming conventions (prefixed with `use`), return plain objects containing refs, and ensure proper lifecycle hook registration inside setup scopes.

## Routing, security, and form handling

- Manage client-side routing with Vue Router 4. Lazy-load route view components using dynamic imports (`component: () => import('./views/DashboardView.vue')`) to split bundles and improve initial page load performance.
- Protect routes and control navigation flows using navigation guards (`router.beforeEach()`). Enforce authentication checks, role validation, and handle redirects predictably.
- Defend against Cross-Site Scripting (XSS): rely on Vue's automatic template escaping. Never use `v-html` on untrusted user-supplied content without pre-sanitizing it with an authoritative sanitizer such as DOMPurify.
- Handle complex forms using type-safe validation libraries like VeeValidate with Zod schemas. Provide immediate, accessible error feedback on touched inputs without triggering jarring validation layout shifts.
- Prevent Cross-Site Request Forgery (CSRF) on session-authenticated backend APIs: ensure HTTP client instances (Axios or native `fetch`) include matching anti-CSRF request headers and send credentials securely.

## Testing, performance, and tooling

- Write automated component tests using Vitest and Vue Test Utils (`@vue/test-utils`). Mount components with `@vue/test-utils`'s `mount()` or `shallowMount()`, providing mock Pinia stores (`createTestingPinia()`) and router instances.
- Test user interactions and DOM outcomes rather than inspecting private component internals: trigger user events (`await wrapper.find('button').trigger('click')`) and assert rendered text, emitted events (`wrapper.emitted()`), and accessible DOM changes.
- Optimize list rendering performance: always provide a unique, stable primitive key (`:key="item.id"`) when using `v-for`. Never use array indices as keys for lists that can be reordered, filtered, or mutated.
- Leverage `<KeepAlive>` for caching expensive view component states during frequent tab switching, and use `<Teleport>` to render modal dialogs and tooltips cleanly outside parent CSS overflow constraints.
- Enforce strict linting and formatting: configure ESLint with `plugin:vue/vue3-recommended`, `@vue/eslint-config-typescript`, and Prettier. Run automated lint and type-check (`vue-tsc --noEmit`) scripts in CI pipelines.
