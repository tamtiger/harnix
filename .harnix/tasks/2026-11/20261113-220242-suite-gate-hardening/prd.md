# PRD: Siết suite gate

## Context & Problem Statement

Suite gate (`src/core/workflow/suite-gate.ts`, `suite-command.ts`) quyết định check nào "chứng minh cả bộ test" trước `ready` và `finish`. Review ngày 2026-11-13 (xem `research.md` của epic, mục P2-1 và P2-2) tìm thấy hai kẽ hở làm một check chỉ chạy một phần test vẫn được coi là suite:

- **P2-1:** `coversSourceAndTest` coi chuỗi `*` là wildcard phủ toàn repo, nhưng glob `*` chỉ khớp file ở thư mục gốc (đo thật: 16 file so với 2089 của `**`). Input là file đơn (`src/a.ts` + `test/a.test.ts`) cũng được coi là "source tree" và "test tree". Một pass ghi với input như vậy không bao giờ stale khi sửa file khác.
- **P2-2:** `acceptsSuiteCommand` trả `true` ngay khi lệnh trùng một lệnh test đã biết, trước khi xét `cwd`. Check `pnpm run test` với `cwd: packages/a` chỉ chạy test của package a nhưng thỏa gate.

## Scope & Boundaries

- Trong phạm vi: `coversSourceAndTest` (bỏ `*` khỏi wildcard, từ chối input file đơn không có glob `**` hay thư mục kết thúc bằng `/`); `acceptsSuiteCommand` (khi check khai báo `cwd` khác `.`, lệnh phải trùng lệnh test của đúng package ở `cwd` đó theo `verify-plan --recursive`); cập nhật tài liệu hợp đồng đóng băng và test.
- Ngoài phạm vi: công thức input digest, circuit breaker (P3-2), ủy quyền baseline (P3-1), đổi danh sách `SOURCE_SEGMENTS`, hành vi `.NET` (`dotnet test` có `cwd` hoặc đường dẫn solution giữ nguyên).
- Không đổi field, enum, đường dẫn hay chuyển tiếp trong `docs/IMPLEMENTATION_PLAN.md` mục 4; chỉ làm rõ luật chấp nhận của suite gate.

## Anchored Acceptance Criteria

- **ac-1:** `coversSourceAndTest` không coi `*` là wildcard toàn repo, và không chấp nhận input file đơn làm cây nguồn hoặc cây test (P2-1). Các dạng đang dùng phổ biến vẫn được chấp nhận: `**`, `**/*`, `.`, `src/**` + `test/**`, `Foo.Api/**` + `Foo.Api.Tests/**`, `src/**/*.ts` + `test/**/*.ts`.
- **ac-2:** `acceptsSuiteCommand` xét `cwd`: lệnh trùng lệnh test gốc nhưng chạy ở `cwd` của một package chỉ được chấp nhận khi trùng lệnh test của chính package đó (P2-2); `cwd` rỗng hoặc `.` giữ hành vi cũ.
- **ac-3:** Hợp đồng được đồng bộ: AGENTS.md (đoạn suite gate), `docs/HARNIX_WORKFLOW.md` mục Suite Gate, `docs/IMPLEMENTATION_PLAN.md`, thông báo lỗi của gate nêu đúng luật mới, golden chỉ đổi đúng chuỗi mới.

## Architectural & Safety Constraints

- Tuân thủ AGENTS.md và `.harnix/spec/guides/` của dự án; `src/core/workflow` giữ trần 300 dòng code mỗi file và complexity ≤ 20.
- Rủi ro tương thích: một task đã `ready` với input kiểu cũ (`*`, file đơn) sẽ bị `finish` từ chối. Chấp nhận có chủ đích vì pass kiểu đó không đáng tin; thông báo lỗi phải nêu cách sửa bằng `--set-check ... --reason` (một replan có bảo vệ). Task `completed` không bị ảnh hưởng.
- `--init --cwd <package-dir>` đã lấy lệnh test từ đúng package ở `verify-plan --recursive`, nên task tạo bằng đường đó vẫn thỏa luật mới.
- Không đọc hay ghi ngoài repo; không thêm phụ thuộc.
