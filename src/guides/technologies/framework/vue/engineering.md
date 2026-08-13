# Vue engineering guide

## Component contracts and state

- Treat props as one-way input. Do not mutate a prop or a nested object owned by the parent; derive local state for an initial value or emit an event so the owner performs the update.
- Declare props and emitted events, with types/validation where supported. A component's public API is its props, slots, events, and visible behavior—keep it small and document non-obvious semantics.
- Keep state near the component that owns it. Lift shared state to a common ancestor first; introduce a store only for state that is genuinely shared across distant views or needs centralized lifecycle/persistence.
- Prefer computed values for derived state. Use watchers for genuine side effects or synchronization, not as a second implementation of a value that can be computed from existing state.

## Effects, input, and accessibility

- Keep network calls, subscriptions, timers, and DOM integration in clear lifecycle/effect code with cleanup. Guard against races when route/prop changes can make an earlier response stale.
- Validate user input on the client for feedback, but treat the server as the authority. Never trust client-side validation or hide authorization decisions in the component tree.
- Use semantic HTML, associated labels, keyboard-operable controls, focus management, and meaningful loading/error states. Do not replace native controls with divs unless equivalent interaction is deliberately implemented.
- Escape/render untrusted content through Vue's normal bindings. Do not render arbitrary HTML with `v-html` unless the content has been sanitized for that exact use case.

## Performance and tests

- Measure before optimizing. Keep props stable in large lists, code-split non-critical routes/features, and avoid expensive reactivity or component abstraction in measured hot paths.
- Test user-visible behavior: rendered output from props/slots, emitted events after interaction, loading/error states, and accessibility semantics. Do not assert private component state or implementation methods.
- Use unit tests for composables and pure utilities; use component/integration tests for routing, store interaction, and lifecycle behavior. Make network and time deterministic.
