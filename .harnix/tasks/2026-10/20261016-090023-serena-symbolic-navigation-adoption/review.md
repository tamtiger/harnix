# Áp dụng điều hướng mã nguồn cấp symbol và tra cứu tham chiếu từ Serena vào Harnix

- **ID:** 20261016-090023-serena-symbolic-navigation-adoption
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-10-16 09:00:23 +07:00
- **Updated:** 2026-10-16 09:57:11 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 5/5 passed |
| Residual risks | 1 | risk-lexical-span-limits: low |

## Goal

Thích nghi clean-room các tính năng tương thích từ oraios/serena vào Harnix: bổ sung harnix repo-map --outline <path> (kèm lọc --symbol và giới hạn dòng startLine-endLine), harnix repo-map --refs <symbol> (tra cứu nơi tham chiếu symbol có giới hạn từ cache), cập nhật hướng dẫn điều hướng symbol-first trong skills/workflow template, và ghi nhận đầy đủ provenance/tài liệu theo chuẩn Harnix.

## Relevant paths

- `docs/HARNESS_FEATURE_PROVENANCE.json`
- `docs/HARNESS_RESEARCH.md`
- `docs/UPSTREAM_BASELINE.md`
- `docs/UPSTREAM_MAPPING.md`
- `src/cli-helpers.ts`
- `src/cli-workflow-commands.ts`
- `src/commands/repo-map-internal.ts`
- `src/core/repo-map/outline.ts`
- `src/core/repo-map/refs.ts`
- `src/core/repo-map/service.ts`
- `src/skills/harnix-implement/SKILL.md`
- `src/skills/harnix-plan/SKILL.md`
- `src/skills/harnix-research/SKILL.md`
- `src/templates/harnix/workflow.md`

## Relevant specs

- `.harnix/spec/guides/common.md`
- `.harnix/spec/guides/languages/typescript.md`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [x] `ac-1` (met): Bổ sung mô-đun trích xuất cấu trúc symbol cấp file src/core/repo-map/outline.ts và hành động harnix repo-map --outline <path> [--symbol <query>] [--limit <count>], trả về danh sách có thứ tự các symbol kèm name, kind, exported, startLine, endLine, signature đã lọc secret mà không cần daemon/LSP hay đổi schema cache RepoMapV1.
- [x] `ac-2` (met): Bổ sung mô-đun tra cứu tham chiếu symbol src/core/repo-map/refs.ts và hành động harnix repo-map --refs <symbol> [--path <target>] [--limit <count>], tận dụng cache RepoMapV1 và đồ thị phụ thuộc để trả về các vị trí tham chiếu (path, line, kind, preview đã lọc secret) an toàn và xác định.
- [x] `ac-3` (met): Tích hợp CLI flags (--outline, --refs, --symbol, --path) vào src/cli-workflow-commands.ts, src/commands/repo-map-internal.ts và cập nhật hướng dẫn điều hướng symbol-first trong src/templates/harnix/workflow.md, src/skills/harnix-implement/SKILL.md, src/skills/harnix-plan/SKILL.md, src/skills/harnix-research/SKILL.md trong trần token budget.
- [x] `ac-4` (met): Ghi nhận đầy đủ provenance của oraios/serena (commit d9e4c796fae0207ba6848d1df4b331122a5567b5, GPL-3.0-or-later clean-room adaptation và các hạng mục rejected) vào docs/HARNESS_FEATURE_PROVENANCE.json, docs/UPSTREAM_BASELINE.md, docs/UPSTREAM_MAPPING.md, docs/HARNESS_RESEARCH.md, docs/HARNIX_PRD.md, docs/HARNIX_WORKFLOW.md, docs/IMPLEMENTATION_PLAN.md, AGENTS.md, README.md và vượt qua toàn bộ test:gates.

## Required checks

- [x] `check-cli-repo-map` (focused): Integration test cho các cờ CLI repo-map --outline và --refs — pass (2026-10-16 09:36:36 +07:00)
- [x] `check-gates` (focused): Contract, CLI, architecture, provenance, docs và token budget gates — pass (2026-10-16 09:55:38 +07:00)
- [x] `check-outline` (focused): Unit test cho trích xuất symbol outline và line span — pass (2026-10-16 09:36:25 +07:00)
- [x] `check-refs` (focused): Unit test cho tra cứu tham chiếu symbol trên đồ thị repo-map — pass (2026-10-16 09:36:30 +07:00)
- [x] `check-suite-v2` (full): Kiểm thử toàn bộ test suite dự án (v2) — pass (2026-10-16 09:56:49 +07:00)

## Decisions

- **dec-serena-clean-room** — Thích nghi clean-room điều hướng symbol (repo-map --outline) và tra cứu tham chiếu (repo-map --refs) từ oraios/serena mà không chạy LSP daemon, không thêm MCP server và không đổi schema cache RepoMapV1
  - _Why:_ Serena dùng GPL-3.0-or-later và kiến trúc Python LSP/MCP server; Harnix giữ ranh giới một gói npm độc lập, deterministic, zero-daemon và tương thích ngược hoàn toàn với RepoMapV1
- **dec-brief-actions-golden** — Khi thêm action ghi mới vào harnix workflow, luôn thêm action vào BRIEF_ACTIONS trong src/core/workflow/brief.ts đồng thời cập nhật constraints.brief trong test/workflow/behavior-snapshot.golden.json.
  - _Why:_ Giữ nhất quán giữa assertCommandShape, workflow.md cookbook, Rule 10 và snapshot schema

## Residual risks

- **risk-lexical-span-limits** (low) — Trích xuất giới hạn dòng symbol (startLine-endLine) và tham chiếu bằng bộ phân tích lexical/ngoặc/thụt lề không giải quyết dynamic dispatch hoặc macro phức tạp như LSP đầy đủ

## Evidence

- `check-outline` — pass (2026-10-16 09:36:25 +07:00): pnpm vitest run test/unit/core/repo-map/outline.test.ts — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `check-refs` — pass (2026-10-16 09:36:30 +07:00): pnpm vitest run test/unit/core/repo-map/refs.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-cli-repo-map` — pass (2026-10-16 09:36:36 +07:00): pnpm vitest run test/integration/commands/repo-map-internal.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-gates` — pass (2026-10-16 09:55:38 +07:00): pnpm test:gates — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `check-suite` — fail (2026-10-16 09:43:22 +07:00): pnpm test — exit 1 _(1 earlier rerun not shown; see task.json for full history)_
- skipped (2026-10-16 09:54:54 +07:00): Task contract revised at persisted replan: Thay thế check-suite sau khi bổ sung setTitle/setGoal vào BRIEF_ACTIONS và cập nhật behavior-snapshot.golden.json theo yêu cầu người dùng
- `check-suite-v2` — pass (2026-10-16 09:56:49 +07:00): pnpm test — exit 0
