# Đưa gợi ý technique đến agent: techniqueHint và bỏ quy tắc Full luôn gợi ý

- **ID:** 20261124-232021-technique-surfacing
- **Mode:** lite
- **Epic:** 20261124-232018-harnix-friction-fixes
- **Status:** planning/planning
- **Created:** 2026-11-24 23:20:21 +07:00
- **Updated:** 2026-11-24 23:21:28 +07:00

**Verdict:** PENDING — 0/4 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/4 met or waived |
| Required checks | 0% | 0/2 passed |

## Goal

Làm cho gợi ý technique skill thật sự đến được agent: một dòng chỉ cách nạp khi có gợi ý, và bớt gợi ý lặp vô ích.

## Acceptance criteria

- [ ] `ac-1` (pending): `workflow --preflight` thêm trường `techniqueHint` một dòng cố định chỉ khi có `suggestedTechniques` (nạp từng skill bằng `harnix skill <tên> --raw`); ngoại lệ so với quy tắc "preflight không emit command" được ghi tường minh trong `docs/HARNIX_WORKFLOW.md`; schema, golden và test preflight cập nhật.
- [ ] `ac-2` (pending): `suggestTechniques` không còn gợi ý `harnix-sequential-thinking` chỉ vì `mode === "full"`: chỉ khi khớp regex (refactor, kiến trúc, đánh đổi...) hoặc số tiêu chí hay số `relevantPaths` vượt ngưỡng chốt bằng decision; test preflight, technique-skills và `skill-routing-cases.json` đồng bộ.
- [ ] `ac-3` (pending): Phương pháp và số đo cơ sở của phân tích mức nạp skill (88 phiên: technique 0 lần nạp, 11 trong 49 reference từng nạp) được ghi vào `research.md` của epic để so sánh lại sau vài tuần bằng cách phân tích transcript ngoài harnix; harnix không thêm bộ đếm hay telemetry.
- [ ] `ac-4` (pending): Tài liệu, CHANGELOG và phiên bản `2.40.0-dev.3` đồng bộ; kiểm bằng CLI thật qua `scripts/exercise-technique-hint.mjs` (preflight trong dự án tạm: task Full đơn giản không còn gợi ý sequential-thinking, task migration có `techniqueHint`).

## Required checks

- [ ] `check-suite` (full): Toàn bộ test của dự án phải xanh — chưa chạy / not yet run
- [ ] `chk-focused` (focused): Test hợp đồng nhanh (docs, CLI, ngân sách token, nguồn skill) — chưa chạy / not yet run

## Decisions

- **dec-contract-exception** — techniqueHint là mở rộng hợp đồng một dòng: contract hiện nói preflight ngoài learning và baselineHint không emit prose hay command. Cần sửa tường minh docs/HARNIX_WORKFLOW.md và PRD, không in lệnh theo từng tên.
  - _Why:_ Người dùng cần chấp nhận khi duyệt epic; nếu từ chối, member này chỉ làm phần bỏ quy tắc Full luôn gợi ý.

## Evidence

_None recorded yet._
