# UI/UX engineering guide

## Verify

```text
npx prettier --check "src/**/*.{css,scss,tsx,jsx,vue,svelte,html}"
npx stylelint "**/*.{css,scss}"
npx axe-core
```

## Constraints

- Design for mobile-first viewport hierarchy; ensure touch targets are at least 44x44px with 8px spacing.
- Enforce accessibility: all interactive elements require visible `:focus-visible` outline and explicit accessible names (`aria-label` or label text).
- Rely on semantic HTML landmarks (`header`, `main`, `nav`, `aside`, `footer`, `section`) rather than generic `div` trees.
- Maintain WCAG AA color contrast ratio: minimum 4.5:1 for normal text, 3:1 for large text and graphical UI controls.
- Use CSS design tokens (variables) for colors, typography scales, radius, and spacing; never hardcode magic hex or px numbers.
- Avoid layout thrashing: animate only composited properties (`transform`, `opacity`) and honor `prefers-reduced-motion`.
- Support responsive font sizing using fluid scales (`clamp()`) with fallback bounds; avoid locking body text to fixed px.
- Support dark and light modes through semantic color tokens with explicit `color-scheme` declarations.
- Form inputs must have persistent associated `<label>` tags, visible validation states, and descriptive `aria-describedby` error messages.

## Common mistakes

- Relying on color alone to convey status, state, or error information.
- Trapping focus or omitting keyboard tab-index flow in custom modal dialogs.
- Hiding content with `display: none` when it should remain available to screen readers (`sr-only` utility).
- Layout shifts (CLS) caused by missing width/height attributes or aspect-ratio on images and media containers.
- Overusing nested z-index layers instead of stacking context management via isolation or dialog elements.
- Blocking mobile zoom by setting `user-scalable=no` or `maximum-scale=1` in viewport meta.
