# Next.js guide

## Verify

```text
tsc --noEmit
eslint .
next build
```

## Constraints

- Default to Server Components; add `'use client'` only to leaf components that use state, effects or browser APIs.
- Keep secrets and DB access server-only (`import 'server-only'`); only `NEXT_PUBLIC_*` variables reach the client.
- Since Next.js 16 the `middleware.ts` convention is deprecated and renamed `proxy.ts` (exported function `proxy`, Node.js runtime, no `runtime` config); migrate with `npx @next/codemod@canary middleware-to-proxy .`.
- `proxy.ts` runs on every request unless `config.matcher` is set; keep it to redirects and rewrites, not data work.
- Server Functions are POST endpoints: authenticate and authorize inside each one, never rely on `proxy.ts` alone.
- Validate Server Function and Route Handler input with a schema parse before use.
- Set caching explicitly: `fetch` `next: { revalidate, tags }`, then `revalidateTag` or `revalidatePath` after mutations.
- Use `next/image` with width/height or `fill` and `next/font`; track Core Web Vitals LCP, CLS and INP.
- Add `error.tsx`, `loading.tsx` and `not-found.tsx` for route segments with async data.

## Common mistakes

- Marking a whole layout `'use client'`, pulling the tree into the client bundle.
- Passing non-serializable props (functions, class instances) from Server to Client Components.
- Calling your own Route Handler from a Server Component instead of the shared service.
- Reading `cookies()` or `headers()` without `await`; they are async in current versions.
- Leaking secrets through `NEXT_PUBLIC_` variables.
