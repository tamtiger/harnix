# Next.js engineering guide

## Application architecture and rendering boundaries

- Choose App Router (`app/`) for modern full-stack architectures. Separate Server Components from Client Components deliberately; default to Server Components for data fetching, backend security, and reduced client bundle footprint.
- Restrict `'use client'` to leaf components that require browser interactivity, client-side hooks (`useState`, `useEffect`, event listeners), or browser-specific Web APIs. Do not mark large layout trees as client components.
- Use Route Handlers (`app/api/**/route.ts`) for headless REST or webhook endpoints. Keep them transport-focused: parse query or JSON parameters, invoke domain services, and return typed `NextResponse` instances with standard HTTP status codes.
- Structure layouts hierarchically using nested `layout.tsx` and `template.tsx`. Use Parallel Routes (`@slot`) and Intercepting Routes (`(..)photo`) only when the UX truly warrants multi-panel or modal routing; avoid over-complicating routing topology for standard page flows.
- Organize features by colocation inside private folders (`_components/`, `_lib/`) or top-level feature directories (`src/features/<feature>/`) to prevent unintended route publication.

## Data fetching, caching, and state management

- Fetch data directly in Server Components using async/await. Keep database connections, ORM queries, and internal service credentials strictly on the server; never expose them through client-side bundles or public environment variables.
- Manage Next.js caching deliberately. Understand the nuances between Request Memoization, Data Cache, Full Route Cache, and Router Cache. Use `fetch(..., { next: { revalidate, tags } })` for cache invalidation tags instead of random cache busting.
- Leverage Server Actions (`'use server'`) for data mutations originating from forms or client UI. Always validate authentication, authorize permissions, and sanitize input arguments inside Server Actions before mutating persistent state.
- Keep optimistic UI updates predictable using `useOptimistic` and transition states with `useTransition`. Ensure optimistic rollbacks gracefully inform the user upon network or server-side validation failures.
- Avoid passing bulky, non-serializable objects or complex class instances across the Server/Client boundary. Serialize clean, typed Plain Old JavaScript Objects (POJOs) or DTOs.

## Validation, security, and runtime configuration

- Validate all incoming request payloads, route params, search queries, and Server Action inputs at runtime using schema validators like Zod or Valibot. Never trust client-submitted parameters implicitly.
- Prevent Cross-Site Scripting (XSS) and injection vulnerabilities by sanitizing dynamic HTML content. Enforce a strong Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), and X-Frame-Options headers via Next.js `middleware.ts` or `next.config.mjs`.
- Separate public configuration from secret credentials. Use `NEXT_PUBLIC_` prefix only for variables that are safe to expose in client browser bundles. Read secret tokens and private API keys only in server contexts.
- Handle errors predictably using `error.tsx` boundaries for UI segments and standard HTTP error responses for API routes. Never leak raw database queries, stack traces, or internal server paths in production responses.
- Implement rate limiting and authentication checks in Edge/Node Middleware or explicit route guards before computationally expensive or sensitive backend operations execute.

## Performance, testing, and observability

- Optimize images using `next/image` to prevent Cumulative Layout Shift (CLS) and leverage automated responsive sizing and WebP/AVIF transcoding. Use `next/font` for local font hosting and zero-layout-shift typography.
- Use dynamic imports (`next/dynamic`) to lazily load heavy third-party client libraries (such as charting, rich text editors, or 3D canvases) outside the critical initial rendering path.
- Write unit tests for business logic, utilities, and helper functions with Jest or Vitest. Test Server Actions and Route Handlers as pure async functions by passing mock requests and assertions.
- Use React Testing Library for Client Components to test accessibility and user interactions without coupling tests to implementation internals. Use Playwright or Cypress for end-to-end user journeys and Server Component validation.
- Implement OpenTelemetry or structured JSON logging for request tracing across serverless and Node.js runtime environments. Monitor Core Web Vitals (LCP, FID/INP, CLS) in production using standard reporting hooks.
