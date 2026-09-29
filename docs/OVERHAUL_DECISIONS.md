# Quyết định đại tu Harnix (Overhaul v2.0.0)

Tài liệu này ghi lại các quyết định đã được người dùng duyệt cho đợt đại tu toàn diện Harnix, cùng những phương án đã bị loại. Nguồn bằng chứng đầy đủ nằm trong task audit `.harnix/tasks/20260928-180123-harnix-overhaul-audit/` (research/, design.md) và epic `.harnix/roadmaps/20260928-180123-harnix-overhaul.md`.

Ngày duyệt: 2026-09-28. Múi giờ mọi mốc thời gian: `Asia/Ho_Chi_Minh` (UTC+7).

## Mục tiêu

Đưa Harnix thành harness gọn nhưng mở rộng đúng chỗ: cắt bộ máy tự bảo vệ và code chết có bằng chứng gần như không được dùng; đồng thời mở rộng verify đa ngôn ngữ, hỗ trợ thêm coding tool qua registry khai báo, giữ và tự động hoá learning, và chuẩn hoá lại code/test. Phát hành một lần dưới version **2.0.0**.

## Bằng chứng nền

- **Chi phí tự thân cao:** ~45% task, ~48% commit và ~58% dòng CHANGELOG trong lịch sử dogfooding là để sửa chính bộ máy workflow (research/usage-evidence.md).
- **Chỉ dẫn quá nặng:** một thay đổi nhỏ tốn ~17–30K token chỉ dẫn; ~65% rule phục vụ máy móc nội bộ (research/inventory.md).
- **Tính năng không dùng:** repo-map query 0 lần, context.json 0/69 task, learning 0 entry; sidecar `verification-inputs.json` tạo ~69K dòng churn (research/usage-evidence.md).
- **Đa ngôn ngữ yếu:** lệnh verify chỉ tự phát hiện cho JS; Java/monorepo không được nhận (research/inventory.md).
- **Research ngoài:** verify bằng exit code thật và "chỉ cho agent biết cần chạy test nào" là hai thứ có bằng chứng đo được; prompt TDD chung chung thì không (research/external-research.md).

## Quyết định đã duyệt

| # | Quyết định | Ghi chú |
| --- | --- | --- |
| D1 | Chấp nhận phá các frozen contract (TaskRecord, sidecar, contractRevision, ready-trace, 3 public command, tên `roadmap`) | Điều kiện bắt buộc: dữ liệu `.harnix/` cũ vẫn đọc được |
| D2 | Version: không bump theo từng task; bump **2.0.0** một lần ở task cuối `release-v2` | Vì có breaking change; tránh 17 bản patch 1.1.x chứa breaking |
| D3 | Coding tool: giữ 4 nền tảng hiện có và **thêm OpenCode, Cursor** (không thêm tool nào khác) | Qua task `add-opencode-cursor`, chỉ bằng bản ghi registry |
| D4 | Learning: **GIỮ + THIẾT KẾ LẠI** (tự động capture/surface), không bỏ | Lý do "0 entry" là lỗi điểm kích hoạt, không phải lỗi ý tưởng |
| D5 | Guides giữ vai trò per-language reference (= ECC `rules/` đã dịch); skill mở rộng là hệ thống riêng, giới hạn 5–10 skill + extension point `.harnix/spec/skills/` | Không cố khớp 292 skill của ECC |
| D6 | Bỏ ý tưởng finish tự chạy lại check; thay bằng **suite gate** dựa trên evidence | Root cause sự cố `pause`: check bỏ sót `test:workflow`; harness không có/không nên có process runner |
| D7 | Chuyển mọi thời gian sang giờ Việt Nam (ISO 8601 kèm offset); dữ liệu cũ chỉ hiển thị lại, không ghi đè | Task `localize-timestamps` |
| D8 | Thống nhất tên "epic" ở mọi nơi (`.harnix/epics/`, `harnix epic`, `epicMembers`) | Task `unify-epic-naming` |
| D9 | Chuẩn hoá code và test: Prettier + ESLint type-checked + max-lines 300; code đúng tầng `commands → core → utils`; test phản chiếu `src`, builder dùng chung, coverage floor | 3 task: `enforce-code-style`, `restructure-code`, `standardize-tests` |
| D10 | Refactor cấu trúc là thuần tuý, không đổi hành vi quan sát được | Có test snapshot trước/sau |
| D11 | Mỗi task phá contract tự cập nhật docs (PRD/WORKFLOW/IMPLEMENTATION_PLAN) trong cùng task | `release-v2` chỉ rà nhất quán lần cuối |
| D12 | `restructure-code` chỉ tách phần thuộc tiêu chí đã duyệt (workflow, `task.ts`, detection/stack, `node:fs` khỏi command) và để các file còn lại trong danh sách miễn trừ của `eslint.config.mjs` với owner ghi rõ: `add-platform-registry` (doctor, global-doctor, global-uninstall, setup, global-managed-files), `add-verify-detection` (config.ts, core/stack/detection.ts), `rewrite-guides` (catalog.ts, validation.ts, guides/catalog.ts), `add-test-impact-map` (repo-map/search.ts). `cli-program.ts`, `core/context/context.ts` và `utils/file-lock.ts` chưa có owner tách nên `release-v2` phải tách hoặc ghi quyết định mới | Danh sách chỉ được thu hẹp; golden `test/workflow/behavior-snapshot.golden.json` sinh trước refactor là bằng chứng không đổi hành vi và không bao giờ được sinh lại để test pass |
| D13 | `standardize-tests`: `test/unit` phản chiếu `src`, `test/integration/commands` phản chiếu `src/commands`, các suite còn lại đặt tên theo tính năng; mọi file test ≤ 400 dòng; builder dùng chung trong `test/support/builders.ts`; import dùng alias `src/...` và `test/...` ở cả `src` và `test` (ESLint cấm `../`); `pnpm test` chạy coverage với sàn `lines`/`statements` 93.1, `functions` 98.1, `branches` 86.8 và `testTimeout` 20 giây. Ngoại lệ dựng record thô có lý do: `task-validate.test.ts` (dữ liệu sai hình dạng có chủ ý), `legacy-data-compat.test.ts` (dữ liệu lịch sử), `behavior-snapshot.test.ts` (oracle). Khối override ESLint cho test (`no-unsafe-*`, `require-await`, `unbound-method`) chưa gỡ được và được giao lại cho `release-v2` | Sàn coverage chỉ được nâng; `@vitest/coverage-v8` 3.2.7 được cài với sự cho phép của người dùng ngày 2026-09-29; số test/assertion không được giảm so với baseline (628 khai báo test, 2.338 `expect`) |
| D14 | `automate-learning`: nguồn quan sát tự động là `decisions`, `residualRisks` và `findings` của evidence trong TaskRecord (không thêm trường vào schema v3), chuẩn hóa và loại trùng, tối đa 5 mỗi lần finish; quan sát `credential-like`/`instruction-override`/`command-like` không bao giờ được capture hay surface; `draft` (một nguồn) tự nâng lên `candidate` khi task thứ hai lặp lại; `draft`/`candidate` quá 28 ngày là `archived` khi đọc (không ghi journal); nền tảng không hook nhận tóm tắt qua trường `learning` của `workflow --preflight` | Promotion vào spec vẫn thủ công có review, không có đường tự động ghi spec; capture là best-effort và không đổi output của `--finish`; hạn chế đã biết: chỉ khớp được quan sát trùng nội dung sau chuẩn hóa, không khớp theo ngữ nghĩa |

## Phương án đã loại

| Phương án | Lý do loại |
| --- | --- |
| Bỏ learning | Người dùng phản hồi; nó có mục đích tự cải tiến, chỉ sai điểm kích hoạt |
| Chuyển guides thành SKILL.md | Guides là bản dịch đúng của ECC `rules/`; `rules/` và `skills/` là hai hệ thống độc lập (đọc trực tiếp repo ECC) |
| Cố khớp 292 skill như ECC | Phần lớn là domain nghiệp vụ ngoài biên Harnix hoặc meta-harness trùng máy móc nội bộ |
| Finish tự chạy lại lệnh từ task.json | Rủi ro command injection; không giải quyết đúng root cause |
| Thêm nhiều coding tool (Copilot, Windsurf...) | Người dùng chỉ muốn thêm OpenCode và Cursor |
| Bump patch mỗi task | Gây hiểu nhầm vì chứa breaking change |
| Viết lại Harnix từ đầu | Mất các cơ chế an toàn đã kiểm chứng (atomic write, lock, reconcile) |

## Thứ tự thực thi (17 task)

Cắt trước → tái cấu trúc → thêm hành vi → viết lại chỉ dẫn → phát hành.

1. `fix-baseline` — HEAD xanh, sinh lại managed output, sửa lệch validator C1–C3
2. `remove-unused-machinery` — gỡ code chết, context-selection; gộp checks/audit/context-report vào `status --explain`
3. `simplify-task-contract` — record gọn, bỏ sidecar, replan một bước, bỏ execution-notes grammar
4. `localize-timestamps` — giờ Việt Nam (D7)
5. `unify-epic-naming` — tên "epic" thống nhất (D8), sửa renderer
6. `enforce-code-style` — Prettier + ESLint type-checked (D9)
7. `restructure-code` — đúng tầng, tách module lớn (D9, D10)
8. `standardize-tests` — chuẩn hoá test, coverage floor (D9)
9. `add-verify-detection` — verify đa ngôn ngữ + suite gate (D6)
10. `automate-learning` — learning tự kích hoạt (D4)
11. `slim-instructions` — gộp 7 skill thành 5, viết lại chỉ dẫn, sửa C4–C8
12. `add-platform-registry` — registry khai báo cho 4 nền tảng
13. `add-opencode-cursor` — thêm OpenCode, Cursor (D3)
14. `rewrite-guides` — guides dạng lệnh + ràng buộc, thêm `spec/project-facts`
15. `add-technique-skills` — 5–10 technique-skill + extension point (D5)
16. `add-test-impact-map` — repo-map hướng test-impact
17. `release-v2` — bump 2.0.0, sinh lại managed output, rà docs, acceptance (D2)

## Mục tiêu đo được sau đại tu

| Chỉ số | Hiện tại | Mục tiêu |
| --- | --- | --- |
| Token chỉ dẫn, thay đổi nhỏ | ~17–30K | ≤ 4K |
| Token chỉ dẫn, task Full | ~37K | ≤ 15K |
| Churn `.harnix` mỗi task | ~1–16K dòng | ≤ 200 dòng |
| Stack có lệnh verify tự phát hiện | 1 (JS) | ≥ 8 |
| Coding tool hỗ trợ | 4 | 6 (thêm OpenCode, Cursor) |
| File `src` > 300 dòng | 11 | 0 |
| Test coverage | chưa đo | có ngưỡng chặn giảm |
