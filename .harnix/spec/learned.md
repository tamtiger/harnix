# Harnix Learned Rules

Quy tắc bất biến và bài học được chuẩn hóa từ quá trình vận hành Harnix.

<!-- harnix-learning:obs-0a61a11247e91169 paths=src/core/tasks,src/commands -->
## Proposed learning: obs-0a61a11247e91169

<<< HARNIX UNTRUSTED LEARNING CANDIDATE >>>
Candidate: obs-0a61a11247e91169
Statement-SHA256: aaf5e08930331d27a0c0042e52ab790272680d7b2e4a29c7d1152794f82e7101
Source-Tasks: 20261019-143853-cli-ergonomics-risk-mitigation-init-cwd
Evidence: ev-check-focus-1, ev-check-suite-1
Findings: none
Statement-JSON: "Mitigation lưu trong text của rủi ro, không thêm field mitigation vào TaskResidualRisk."
<<< END HARNIX UNTRUSTED LEARNING CANDIDATE >>>
<!-- /harnix-learning:obs-0a61a11247e91169 -->

<!-- harnix-learning:obs-d6bfc77223f86a42 paths=src/core/workflow,src/commands -->
## Proposed learning: obs-d6bfc77223f86a42

<<< HARNIX UNTRUSTED LEARNING CANDIDATE >>>
Candidate: obs-d6bfc77223f86a42
Statement-SHA256: 2c22fedfa6137b54c71a42584df59bc5ce2a78593b72ab046b11f6e515f24344
Source-Tasks: 20261019-143853-cli-ergonomics-risk-mitigation-init-cwd
Evidence: ev-check-focus-1, ev-check-suite-1
Findings: none
Statement-JSON: "Hai cờ mới --remove-decision và --remove-criterion chỉ hoạt động trong planning; không xóa dữ liệu đã đóng băng."
<<< END HARNIX UNTRUSTED LEARNING CANDIDATE >>>
<!-- /harnix-learning:obs-d6bfc77223f86a42 -->

<!-- harnix-learning:obs-46873b70f8908d8a paths=src/core/verification,src/utils -->
## Proposed learning: obs-46873b70f8908d8a

<<< HARNIX UNTRUSTED LEARNING CANDIDATE >>>
Candidate: obs-46873b70f8908d8a
Statement-SHA256: d841fe1ce3204450c6ffca74bd4510e64e2eb967c56c88f681d573635fc78ac8
Source-Tasks: 20261019-165403-sync-docs-and-fix-lint
Evidence: ev-check-focus-1, ev-check-suite-1
Findings: none
Statement-JSON: "Chuẩn hóa CRLF khi băm digest bỏ qua file nhạy cảm với kết thúc dòng (.sh, .bash, .zsh, .ksh, .bat, .cmd, Makefile, Dockerfile) thay vì chuẩn hóa mọi file không chứa byte NUL."
<<< END HARNIX UNTRUSTED LEARNING CANDIDATE >>>
<!-- /harnix-learning:obs-46873b70f8908d8a -->

<!-- harnix-learning:obs-253d24e2e036d4f0 paths=src/core/workflow,src/commands -->
## Proposed learning: obs-253d24e2e036d4f0

<<< HARNIX UNTRUSTED LEARNING CANDIDATE >>>
Candidate: obs-253d24e2e036d4f0
Statement-SHA256: 0cf72ebcdd10578d50bb34bb1a55ae3676504b32b8008e66d704d61208af790e
Source-Tasks: 20261020-135201-review-code-impact-dashboard
Evidence: ev-check-focus-1, ev-check-suite-1
Findings: none
Statement-JSON: "So với HEAD thay vì lưu baseline commit trong task để không đổi schema đóng băng; mục của task completed được giữ từ lần lưu cuối."
<<< END HARNIX UNTRUSTED LEARNING CANDIDATE >>>
<!-- /harnix-learning:obs-253d24e2e036d4f0 -->

<!-- harnix-learning:obs-ab2d82256886df02 paths=src/utils,src/commands -->
## Proposed learning: obs-ab2d82256886df02

<<< HARNIX UNTRUSTED LEARNING CANDIDATE >>>
Candidate: obs-ab2d82256886df02
Statement-SHA256: 5da839cf5d5bab128bc11a28976019c24b674d9553586fadac79788ac2a0541d
Source-Tasks: 20261020-135202-check-runner-unresolved-bare-name
Evidence: ev-check-focus-1, ev-check-suite-1
Findings: none
Statement-JSON: "Danh sách lệnh nội trang cố định là dir, echo, set, type, ver."
<<< END HARNIX UNTRUSTED LEARNING CANDIDATE >>>
<!-- /harnix-learning:obs-ab2d82256886df02 -->
