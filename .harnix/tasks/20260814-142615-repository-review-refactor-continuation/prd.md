# PRD task: Tiếp tục review và refactor toàn repository

## Kết quả mong muốn

Thực hiện review có hệ thống trên toàn bộ repository Harnix, lập inventory finding theo bằng chứng và refactor mọi finding correctness, security, safety hoặc maintainability có tác động thực tế mà không thay đổi trái phép public contract. Phần `metadata.version` của bảy skills là một hạng mục nhỏ đã có trong working tree và phải được giữ xanh trong kết quả tổng thể, không phải mục tiêu độc lập.

## Trong phạm vi

- Bao phủ tài liệu normative, package/dependency graph, release scripts, CLI/commands, configurators, core services, migration, templates/rules/guides/skills, utilities và toàn bộ test harness.
- Lập audit matrix theo subsystem; mỗi finding phải có severity, file/contract, reproduction hoặc static evidence, root cause, quyết định sửa/giữ/defer và verification.
- Sửa toàn bộ finding P0–P2 được xác nhận; chỉ thực hiện P3 khi giảm complexity/duplication đo được và không tạo abstraction suy đoán.
- Kiểm tra dependency direction, dead code/import, duplication, error/exit semantics, atomicity/concurrency, path/symlink safety, secret/machine-path disclosure, deterministic output, performance và test gaps.
- Giữ và tái kiểm tra slice skill version đã triển khai trong task `20260814-134012-repository-audit-refactor` như một phần của baseline refactor.
- Cập nhật docs, package patch version và CHANGELOG sau khi toàn bộ finding của đợt này đã được xử lý.

## Ngoài phạm vi

- Không thêm platform, package, workspace, service hoặc compatibility surface mới.
- Không đổi frozen schema/CLI/hook/exit contract nếu không có finding bắt buộc và cập nhật đồng bộ toàn bộ normative docs/migration/tests.
- Không refactor chỉ vì style, rename hàng loạt hoặc tạo abstraction chưa có ít nhất hai consumer thực tế.
- Không chạm real user profile; mọi filesystem/global test dùng injected disposable homes.
- Không commit, branch, push, publish hoặc tạo pull request.

## Quy tắc ưu tiên

Correctness và bảo toàn dữ liệu đứng trước security/safety, sau đó mới đến contract consistency, maintainability, performance và style. Một suite đang xanh không được dùng thay cho review; mỗi subsystem phải có disposition rõ ràng trong audit matrix.

## Tính liên tục

Task completed trước được giữ nguyên như lịch sử vì Harnix không rewrite completion record. Continuation này là phần còn lại của cùng yêu cầu repo-wide. Các thay đổi hiện có, gồm skill version, workflow recovery, marker safety và dependency remediation, là baseline cần được review lại cùng toàn repository.