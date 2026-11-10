# PRD: Làm bền cơ chế setup và update global

## Context & Problem Statement

Review phát hiện các điểm mong manh của lớp reconcile user-global: rollback giao dịch chỉ xóa file nên thư mục do giao dịch tạo vẫn còn (Antigravity với `preserveUnownedRoot` bị kẹt `untracked-collision`); nếu tiến trình bị dừng giữa lúc ghi file và ghi manifest thì file Harnix tự sinh bị coi là của người dùng; collision chỉ xét `SKILL.md` nên `references/*.md` bị ghi vào skill của người dùng; `toml-guard` bỏ sót `UserPromptSubmit.x = 1` và key có ngoặc kép nên có thể sinh TOML không hợp lệ; `releaseGlobalLocks` dùng `Promise.all` che lỗi gốc; guard chống ghi vào home thật trong test chỉ kiểm `homeResolver`, còn `environment` vẫn rơi về `process.env`.

## Scope & Boundaries

- Trong phạm vi: `src/core/global/`, `src/core/managed/`, `src/commands/setup.ts`, `global-update.ts`, `global-uninstall.ts`, `src/core/doctor/global.ts`, `src/utils/test-process.ts` và test tương ứng.
- Ngoài phạm vi: thay registry platform thành map, update theo từng target (ghi vào residual risk), thêm platform mới.

## Anchored Acceptance Criteria

- ac-1: rollback xóa thư mục do giao dịch tạo.
- ac-2: file giống hệt desired mà chưa có manifest được nhận (adopt).
- ac-3: collision bảo vệ cả thư mục skill của người dùng, kể cả `references/`.
- ac-4: `toml-guard` bắt dotted/quoted key của `UserPromptSubmit`.
- ac-5: phát hiện platform đã cài cô lập lỗi root; `releaseGlobalLocks` không che lỗi gốc.
- ac-6: các điểm vào global từ chối khi test thiếu `environment` cùng `homeResolver`.

## Architectural & Safety Constraints

Tuân theo `AGENTS.md` và `.harnix/spec/guides/`: ghi nguyên tử bảo toàn quyền, giữ nội dung người dùng đã sửa, không đụng home thật, rollback bảo thủ, không đổi frozen contract của manifest sidecar.
