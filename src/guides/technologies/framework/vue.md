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
- Use `ref`/`reactive` for state and `computed` for derived values; do not store derived state in a `ref`; keep `computed` getters pure (no side effects, async or DOM access).
- Do not destructure a `reactive` object or Pinia store without `toRefs`/`storeToRefs` (props too before Vue 3.5); plain destructure drops reactivity.
- Give `v-for` a stable unique `:key` (not the index for reorderable lists); never combine `v-if` with `v-for` on one element.
- Clean up side effects (timers, listeners, subscriptions) in `onUnmounted` or the `watchEffect` cleanup callback.
- Share state through Pinia stores or composables, not module-level mutable singletons in SSR code.
- Lazy-load routes with `() => import(...)` in vue-router.
- Never compile user input as a template or bind it to `:is`, `:href`/`:src` (allow http/https/mailto only), `:style` or event attributes; avoid `v-html` on untrusted content; `VITE_*` values ship to the browser.

## Common mistakes

- Mutating props or nested prop objects directly.
- Using `watch` where `computed` fits, or watching `state.prop` directly instead of a getter `() => state.prop`.
- Forgetting `.value` on a `ref` in script code.
- Calling composables that use lifecycle hooks, `provide` or `inject` outside synchronous `setup`.
- Mixing Options API and Composition API in one component.
- Calling `$reset()` on a Pinia setup store (it is not provided; define your own).
