# Vue guide

## Verify

```text
vue-tsc --noEmit
eslint .
vitest run
vite build
```

## Constraints

- Use `<script setup lang="ts">` with the Composition API for new components.
- Type props and emits with `defineProps<T>()` and `defineEmits<T>()`; never mutate a prop.
- Use `ref`/`reactive` for state and `computed` for derived values; do not store derived state in a `ref`.
- Do not destructure `reactive` objects or props without `toRefs`/`toRef`; reactivity is lost.
- Give `v-for` a stable unique `:key` (not the index for reorderable lists); never combine `v-if` with `v-for` on one element.
- Clean up side effects (timers, listeners, subscriptions) in `onUnmounted` or the `watchEffect` cleanup callback.
- Share state through Pinia stores or composables, not module-level mutable singletons in SSR code.
- Lazy-load routes with `() => import(...)` in vue-router.
- Avoid `v-html` with untrusted content.

## Common mistakes

- Mutating props or nested prop objects directly.
- Using `watch` where `computed` fits.
- Forgetting `.value` on a `ref` in script code.
- Registering global listeners in setup without removing them.
- Mixing Options API and Composition API in one component.
