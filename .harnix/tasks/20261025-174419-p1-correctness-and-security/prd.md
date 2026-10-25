# PRD: Sửa 8 lỗi P1 từ review toàn diện

## Context & Problem Statement

Đợt review toàn diện (4 vùng, chạy song song) tái hiện được 8 lỗi P1 ở workflow core, commands, stack, utils và journal. Hai lỗi chạm bảo mật (git chạy chương trình trong .git/config, ReDoS từ .harnixignore), hai lỗi lộ hoặc lọt dữ liệu nhạy cảm qua learning, ba lỗi làm sai trạng thái hoặc mất dữ liệu, và một lỗi cờ không khớp tài liệu.

## Scope & Boundaries

Trong phạm vi: tám lỗi ở relevantPaths, kèm test hồi quy cho từng lỗi. Ngoài phạm vi: ý định circuit breaker (run-checks với digest), A4/A5 và mọi P2 (task kế tiếp), refactor cấu trúc, tối ưu token.

## Anchored Acceptance Criteria

- ac-1: save lại task đã kết thúc bị từ chối, không ghi lại .active.
- ac-2: ghi song song không mất cập nhật im lặng.
- ac-3: verify-plan --changed dùng git an toàn.
- ac-4: glob .harnixignore không backtrack.
- ac-5: --set-paths --file được chấp nhận.
- ac-6: harnix epic mới nhất trước, total đúng.
- ac-7: learning-safety chặn URL có userinfo và query khóa bí mật.
- ac-8: learning-safety bắt override có xuống dòng hoặc ký tự vô hình.

## Architectural & Safety Constraints

Tuân thủ AGENTS.md và .harnix/spec/guides/. Không đổi field, enum hay hook protocol đóng băng. Thứ tự và nghĩa của total trong harnix epic có thể thuộc public contract: cập nhật docs/HARNIX_PRD.md và test cùng thay đổi. Không hạ coverage, không regenerate golden ngoài đúng chuỗi mới.
