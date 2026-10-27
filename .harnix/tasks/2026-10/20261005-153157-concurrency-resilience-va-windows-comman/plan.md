# Plan - Concurrency Resilience và Windows Command Auto-Normalization

## Checklist
- [x] Nâng timeout mặc định của `acquireHarnixFileLock` lên 30.000 ms với backoff jitter trong `src/utils/file-lock.ts`.
- [x] Tự động normalize `npm`, `pnpm`, `npx`, `yarn`, `corepack` trên Windows trong `src/utils/check-runner.ts`.
- [x] Cập nhật và bổ sung unit test cho `file-lock.test.ts` và `check-runner.test.ts`.
- [x] Chạy verification checks và suite gate.
