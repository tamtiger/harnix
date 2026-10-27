# Refactor và đồng bộ toàn diện 7 Canonical Skills, AGENTS.md và AGENTS Template

- **ID:** 20260925-141701-skills-agents-template-harmonization
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-25T07:20:56.886Z
- **Updated:** 2026-09-25T07:30:32.532Z

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Lấp toàn bộ khoảng trống cross-cutting giữa 7 skills, AGENTS template và root AGENTS.md: repo-map, spec/guides, Epic Roadmap, checklist 100% [x], structured findings, commit approval 2 bước, tiếng Việt, version sync 1.1.19, và bảo đảm renderAgentsTemplate < 8,192 bytes.

## Non-goals

- Không thay đổi frozen schema contracts của TaskRecord.
- Không vượt quá ngưỡng 8,192 bytes của renderAgentsTemplate.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-agents-template-budget` (met): Template agents.ts được tối ưu hóa câu chữ, bảo đảm byte length < 8,192 bytes và pass test/workflow/templates.test.ts
- `ac-root-agents-harmonization` (met): Root AGENTS.md của repo Harnix được bổ sung đầy đủ chỉ dẫn repo-map và spec/guides
- `ac-skills-cross-cutting-gaps` (met): Tất cả 7 skills được bổ sung đầy đủ chỉ dẫn hành động về repo-map, spec/guides, Epic Roadmap, checklist [x], commit approval và tiếng Việt
- `ac-skills-version-sync` (met): Cả 7 file SKILL.md được đồng bộ version metadata lên 1.1.19
- `ac-verification-suite` (met): Toàn bộ test suite unit, integration và templates pass 100%

## Required checks

- `check-templates-test` (focused): Chạy suite kiểm thử templates test/workflow/templates.test.ts — pass (2026-09-25T07:29:55.926Z)
- `check-skills-audit` (focused): Kiểm tra 7 skills đồng bộ version 1.1.19 và quy chuẩn cross-cutting qua test/unit/rules.test.ts — pass (2026-09-25T07:29:55.926Z)
- `check-full-build-and-test` (full): Chạy full build, typecheck, lint và unit tests toàn hệ thống — pass (2026-09-25T07:29:55.926Z)

## Decisions

- **dec-1** — Giữ nguyên logic footprint dưới 8,192 bytes cho agents.ts bằng cách cô đọng văn phong tiếng Anh kỹ thuật
  - _Why:_ Bảo vệ context window và thỏa mãn test gate test/workflow/templates.test.ts
- **dec-2** — Bổ sung điều khoản Tiếng Việt trực tiếp vào cả 7 file SKILL.md
  - _Why:_ Bảo đảm agent đọc bất kỳ skill nào theo lazy loading đều giao tiếp và viết artifacts bằng tiếng Việt

## Evidence

- `check-templates-test` — pass (2026-09-25T07:29:55.926Z): pnpm vitest run test/workflow/templates.test.ts — passed 7/7 tests — đã kiểm chứng byte length < 8,192 bytes
- `check-skills-audit` — pass (2026-09-25T07:29:55.926Z): pnpm vitest run test/unit/rules.test.ts — passed 16/16 tests — 7 skills đồng bộ version 1.1.19 và quy chuẩn cross-cutting
- `check-full-build-and-test` — pass (2026-09-25T07:29:55.926Z): pnpm build && pnpm typecheck && pnpm lint && pnpm test:unit — 292 unit tests passed, clean build và lint
