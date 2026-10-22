# Kế hoạch thực thi: `harnix-arch-review`

## Execution Checklist

- [x] [check-gates] Slice 1 (`ac-4`, `ac-1`, `ac-2`): Viết test RED trong `test/unit/skills/technique-skills.test.ts` và `test/workflow/skill-sources.test.ts` cho `harnix-arch-review` cùng 2 references (`domain-briefs`, `wbs-consolidation`), sau đó tạo `src/skills/harnix-arch-review/SKILL.md` và `src/skills/harnix-arch-review/references/{domain-briefs,wbs-consolidation}.md` để đạt GREEN.
- [x] [check-gates] Slice 2 (`ac-3`): Đăng ký `harnix-arch-review` vào `src/skills/technique-skills.ts`, cập nhật `docs/HARNIX_PRD.md` và `docs/UPSTREAM_MAPPING.md`.
- [x] [check-suite] Slice 3 (`ac-5`): Chạy `pnpm version:sync 2.16.0 --fold-dev --summary 'Tích hợp tinh hoa Backend Harness và Architecture Review từ 04. Backend'` và xác minh toàn bộ `pnpm run test:gates` cùng `pnpm run test` đạt exit code 0.
