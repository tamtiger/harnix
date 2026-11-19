# Research: skill tự sinh test và chạy thật (harnix-exercise)

- Epic: `20261119-140811-exercise-skill`
- Ngày: 2026-11-19 (Asia/Ho_Chi_Minh); truy cập nguồn ngoài cùng ngày
- Loại: standalone `harnix-research`, chỉ đọc; không ghim được commit SHA vì công cụ fetch không trả SHA

## 1. Câu hỏi quyết định

Làm sao để agent tự sinh test case rồi chạy thật (gọi API, mở browser, chạy CLI) và ghi bằng chứng, mà không vi phạm ranh giới sản phẩm của Harnix (một package, không MCP mặc định, không network ngầm, không tự commit, trần token)?

## 2. Bằng chứng trong repo

- Upstream đã khóa: Trellis (AGPL-3.0, không được chép), ECC (MIT), Superpowers (MIT) (`docs/UPSTREAM_BASELINE.md`).
- Superpowers đã được adopt phần verification-before-completion và TDD; nó không có browser hay API testing, nên không có gì thêm để lấy cho hướng này.
- ECC chưa được lấy phần test thật: hiện chỉ có nội dung debug, verify, TDD, plan, review.
- `src/skills/` có 13 skill, chưa skill nào chạy app hay gọi API thật. Gần nhất là `harnix-flaky-test` và `harnix-verification-gap`.
- Đăng ký technique skill đi qua `src/skills/technique-skills.ts`; gợi ý qua `src/core/workflow/preflight.ts`; test ở `test/workflow/skill-sources.test.ts`, `test/unit/skills/technique-skills.test.ts`, `test/integration/commands/skills.test.ts`, `test/unit/core/workflow/preflight.test.ts`.

## 3. Nguồn ngoài đã đọc

| Nguồn | Giấy phép | Quyết định | Ghi chú |
|---|---|---|---|
| [anthropics/skills `webapp-testing`](https://github.com/anthropics/skills/tree/main/skills/webapp-testing) ([SKILL.md](https://raw.githubusercontent.com/anthropics/skills/main/skills/webapp-testing/SKILL.md), [LICENSE](https://raw.githubusercontent.com/anthropics/skills/main/skills/webapp-testing/LICENSE.txt)) | Apache-2.0 (đã đọc LICENSE.txt) | adapt | Khảo sát rồi hành động; helper `with_server.py` quản lý vòng đời server; cây quyết định static/dynamic. Chỉ lấy ý, viết lại quản lý server theo mảng args, không dùng shell. |
| [ECC `agents/e2e-runner.md`](https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/agents/e2e-runner.md) | MIT | adapt | 3 pha plan/create/execute, selector `data-testid`, `--repeat-each` bắt flaky, trace on first retry. Bỏ `npm install -g` và mặc định agent-browser. |
| [ECC `skills/browser-qa`](https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/skills/browser-qa/SKILL.md) | MIT | adapt | 4 pha smoke → interaction → visual → a11y; mặc định chỉ đọc; mutation chỉ trên staging và cần opt-in; che PII. Bỏ tên tool gắn MCP và visual regression (cần baseline). |
| [ECC `skills/ai-regression-testing`](https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/skills/ai-regression-testing/SKILL.md) | MIT | adapt | Ép sandbox/mock, helper gọi route, kiểm hình dạng response, test hồi quy đặt tên theo lỗi. |
| [ECC `agents/gan-evaluator.md`](https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/agents/gan-evaluator.md) | MIT | reject | Chấm điểm thẩm mỹ chứ không kiểm đúng/sai; lệnh trong prompt là giả mã; phụ thuộc `gan-harness/`. Giữ một bài học: báo cáo đúng chế độ thực sự chạy được (full, screenshot, code-only). |
| [ECC `orch-fix-defect`](https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/skills/orch-fix-defect/SKILL.md) và họ `orch-*` | MIT | reject (giữ ý) | Thiết kế đa subagent và commit sau cổng, mâu thuẫn core single-agent và không auto commit. Ý giữ lại: reproduce thành test fail trước khi sửa (đã có ở `harnix-debug`). |
| [ECC `skills/verification-loop`](https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/skills/verification-loop/SKILL.md) | MIT | defer | Không chạy app, API hay browser. Đáng lấy: quy tắc target acceptance (kiểm local không tính là kiểm môi trường đích). |
| [Playwright Test Agents](https://playwright.dev/docs/test-agents) | chưa xác minh | học ý, không phụ thuộc | `npx playwright init-agents --loop=claude\|codex\|opencode\|vscode`; planner, generator, healer. Sinh agent definition riêng từng nền tảng nên chồng lên `harnix setup`. Docs không nêu phiên bản giới thiệu. |
| [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) | Apache-2.0 | công cụ tùy chọn | CLI Rust; `snapshot -i` ra ref `@e1`; Windows x64; cần `agent-browser install` để tải Chrome nên phải hỏi người dùng. |
| [Schemathesis](https://github.com/schemathesis/schemathesis) | MIT | công cụ tùy chọn (API có OpenAPI) | `schemathesis run <openapi-url>`; stateful; báo cáo JUnit/HAR. Cảnh báo chính thức: gửi request thật tạo, sửa, xóa dữ liệu, chỉ chạy trên dev/staging. |
| [Hurl](https://github.com/Orange-OpenSource/hurl) | Apache-2.0 | ưu tiên cho API không có OpenAPI | File text `.hurl`, `[Captures]`, `[Asserts]`, `--test --report-junit`; exit code riêng cho parse/runtime/assert; có binary Windows. |

## 4. Kết luận

Làm một technique skill mỏng `harnix-exercise`, không thêm stage, không thêm package hay bin. Quy trình: tiêu chí chấp nhận → kịch bản (happy, biên, lỗi) → chọn công cụ có phát hiện sự có mặt → sinh test gắn `[chk-id]` → khởi chạy có kiểm soát → ghi bằng chứng qua `harnix workflow --run-check`. Công cụ ngoài chỉ là tùy chọn có đường lui; thiếu thì hạ bậc xuống code-only và báo rõ.

Thứ tự công cụ:

| Loại | Chính | Dự phòng |
|---|---|---|
| API | test của framework dự án; Hurl | Schemathesis nếu có OpenAPI; script gọi bằng runtime sẵn có |
| Web | Playwright của dự án | agent-browser, rồi browser tool của nền tảng, rồi code-only |
| CLI/thư viện | chạy lệnh thật, kiểm stdout/exit code | script smoke như một consumer |

v1 chỉ làm API, CLI, thư viện và web; mobile, TUI, job/queue, performance, security smoke để sau.

## 5. Phản biện

- "Chỉ cần Playwright agents có sẵn": `weakens` (cấu hình riêng từng nền tảng, gắn Playwright, hai nền tảng Harnix hỗ trợ không có browser tool), nhưng chu trình plan → sinh → heal vẫn đáng học.
- "`harnix-verify` đủ rồi": `weakens` (nó chạy lệnh test sẵn có, không sinh hay khởi chạy app). Phương án rẻ hơn nếu tín hiệu thấp: bắt đầu bằng một `--reference` trong `harnix-verify`.
- "Công cụ ngoài là rủi ro supply chain": `supports`, nên mọi công cụ ở dạng tùy chọn, không thuộc package, và cài đặt luôn hỏi người dùng.

## 6. Giới hạn và bất định còn lại

- Không có SHA nào được ghim; lệnh và phiên bản CLI của Schemathesis, Playwright agents có thể đã đổi, cần kiểm lại trước khi viết hướng dẫn.
- Giấy phép Playwright và tài liệu agents chưa đọc trực tiếp.
- Danh sách skill của ECC chỉ đọc được một phần; `orch-pipeline` và các skill `orch-*` khác chưa đọc.
- Chưa khảo sát OpenHands, SWE-agent, Cline, Aider về cách họ tự chạy và xác nhận.
- Chưa có số đo hiệu quả; cần fixture API và CLI mẫu trong `test/`.
- Chưa thử trên Cursor và Kiro.

Điều kiện mở lại: nếu một member phát hiện lệnh hay giấy phép khác với bảng trên, cập nhật bảng này và các reference tương ứng trước khi freeze.
