# PRD — [09] Phát hiện lệnh verify đa ngôn ngữ, workspace và suite gate

## Bối cảnh & Mục tiêu

Hiện tại, việc tự phát hiện lệnh verify trong Harnix chỉ hỗ trợ một hệ sinh thái duy nhất là JavaScript/TypeScript (thông qua các script `build`, `lint`, `test`, `typecheck` trong `package.json`), và chưa hỗ trợ monorepo đa ngôn ngữ. Bên cạnh đó, sau sự cố task `pause` (task hoàn thành ở trạng thái `completed` nhưng để lại HEAD đỏ vì check verification chỉ chạy `test:unit` và `test:integration`, bỏ sót `test:workflow` và chỉ khai báo input `src/**/*.ts`), Harnix cần một cơ chế bảo vệ ở tầng workflow gọi là **Suite Gate**.

Mục tiêu của task:
1. Phát hiện deterministic lệnh test/lint/typecheck/format theo manifest, lockfile và task runner cho ≥ 8 hệ sinh thái: npm/pnpm/yarn/bun (Node.js), uv/poetry/pip (Python), cargo (Rust), go (Go), gradle/maven (Java/Kotlin), dotnet (C# / .NET), composer (PHP), swift (Swift), flutter/dart (Flutter).
2. Quy tắc nearest-manifest-wins cho monorepo: pnpm workspace, Cargo workspace, go.work, Maven multi-module sinh lệnh theo từng package.
3. Trường hợp repo không có test (`hasTests: false`) phải được báo rõ và yêu cầu khai báo check thay thế (`documented-exception`), không âm thầm coi là pass.
4. Lưu cấu hình `verify:` trong `.harnix/config.yaml` và cung cấp lệnh public `harnix verify-plan`.
5. **Suite Gate**:
   - `ready` bắt buộc task phải có ít nhất một check mức project phủ toàn bộ source và test (lấy từ verify-plan/config).
   - `finish` từ chối nếu check suite đó không có kết quả pass với input digest hiện hành.
   - Có regression test tái hiện đúng kịch bản lỗi của task `pause` và chứng minh bị chặn.
6. Tái cấu trúc `config.ts` và `core/stack/detection.ts` về dưới 300 dòng, gỡ khỏi danh sách miễn trừ `VERIFY_DETECTION_MODULES` trong `eslint.config.mjs`.

## Non-goals

- Không thực thi (execute/spawn) lệnh verify trong harness (Harnix không có process runner để tránh nguy cơ command injection; chỉ phát hiện và kiểm tra evidence).
- Không tự động commit, push, tạo branch, worktree hay PR.
- Không sửa đổi cấu hình global của người dùng trong test.
- Không bump version trong task này (version 2.0.0 được bump một lần ở task `release-v2`).

## Acceptance Criteria

### `ac-detect`
Fixture cho ≥ 8 hệ sinh thái sinh đúng lệnh verify (test/lint/typecheck/format).

**Verifies:** `check-detect-ecosystems`

### `ac-workspace`
Monorepo pnpm, Cargo, go.work, Maven modules sinh đúng lệnh verify theo từng package con theo nguyên tắc nearest-manifest-wins.

**Verifies:** `check-monorepo-workspaces`

### `ac-no-tests`
Repo/package không có test được báo rõ ràng (`hasTests: false` và warning), bắt buộc khai báo check thay thế có lý do; không tự động tính là pass.

**Verifies:** `check-no-tests-warning`

### `ac-suite-gate`
Ready từ chối task thiếu check mức project phủ toàn bộ source+test; finish từ chối khi check đó không có pass với digest hiện hành; regression test tái hiện kịch bản task pause (check chỉ unit+integration) bị từ chối.

**Verifies:** `check-suite-gate`

### `ac-docs-sync`
PRD/WORKFLOW/IMPLEMENTATION_PLAN và README/skill liên quan được cập nhật đồng bộ các hợp đồng và lệnh mới (`verify-plan`, `verify:`, suite gate).

**Verifies:** `check-docs-sync`
