# Epic: Xử lý các phát hiện từ review toàn bộ Harnix (2026-11-13)

Sửa các phát hiện P1/P2 và nhóm P3 có bằng chứng của đợt review toàn bộ Harnix ngày 2026-11-13, trong ranh giới sản phẩm hiện tại. Quy tắc phiên bản: các member bump 2.33.0-dev.N theo thứ tự, member cuối đóng epic bằng 2.33.0.

- **Cập nhật:** 2026-11-13 22:13:05 +07:00

## Non-goals

- Không thêm nền tảng thứ bảy, MCP, daemon, network ngầm hay tự động hóa Git.
- Không làm các refactor lớn (A4, A5, A7, A11) và tính năng mới (spec sống, wave song song) trong epic này.

## Next task

Không còn task nào chưa hoàn tất.

## Members (6 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261113-220241-uninstall-link-safety` | Uninstall không xóa junction/symlink của profile và doctor cảnh báo file dùng chung | `lite` | `completed` |
| 2 | `20261113-220243-doctor-hardening` | Doctor: cô lập lỗi theo nền tảng và cảnh báo cache repo-map bị git theo dõi | `lite` | `completed` |
| 3 | `20261113-220244-workflow-error-hints` | Hint và kiểm kiểu cho các lỗi flag workflow agent hay gặp | `lite` | `completed` |
| 4 | `20261113-220245-platform-facts-verification` | Xác minh facts nền tảng trên profile dùng thử và cập nhật facts.ts | `lite` | `completed` |
| 5 | `20261113-220246-token-and-docs-hygiene` | Đo token đúng, nâng sàn test và đồng bộ tài liệu | `lite` | `completed` |
| 6 | `20261113-220242-suite-gate-hardening` | Siết suite gate: loại kẽ hở wildcard và cwd làm pass giả | `full` | `completed` |

## Task Overview & Scope

### 1. `20261113-220241-uninstall-link-safety` — Uninstall không xóa junction/symlink của profile và doctor cảnh báo file dùng chung

- **Trạng thái:** `completed`
- **Mục tiêu:** Sau khi cho phép junction con trong root override (2.32.4), uninstall và doctor phải xử lý đúng các link đó: không xóa link, và phát hiện khi hai manifest cùng sở hữu một file vật lý.
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 2. `20261113-220243-doctor-hardening` — Doctor: cô lập lỗi theo nền tảng và cảnh báo cache repo-map bị git theo dõi

- **Trạng thái:** `completed`
- **Mục tiêu:** doctor không báo invalid cho mọi nền tảng vì một biến môi trường sai, và phát hiện .harnix/cache bị git theo dõi.
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 3. `20261113-220244-workflow-error-hints` — Hint và kiểm kiểu cho các lỗi flag workflow agent hay gặp

- **Trạng thái:** `completed`
- **Mục tiêu:** Các lỗi agent hay gặp khi dùng harnix workflow nêu rõ cách thoát và không lộ lỗi nội bộ.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 4. `20261113-220245-platform-facts-verification` — Xác minh facts nền tảng trên profile dùng thử và cập nhật facts.ts

- **Trạng thái:** `completed`
- **Mục tiêu:** Các rủi ro tương thích còn là suy luận được kiểm chứng trên một profile dùng thử, và facts.ts, setupNotice, doctor phản ánh kết quả.
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 5. `20261113-220246-token-and-docs-hygiene` — Đo token đúng, nâng sàn test và đồng bộ tài liệu

- **Trạng thái:** `completed`
- **Mục tiêu:** Các số đo và sàn kiểm tra phản ánh đúng thực tế, và tài liệu không còn mâu thuẫn với code; member cuối đóng epic bằng release 2.33.0.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 6. `20261113-220242-suite-gate-hardening` — Siết suite gate: loại kẽ hở wildcard và cwd làm pass giả

- **Trạng thái:** `completed`
- **Mục tiêu:** Một check suite chỉ được chấp nhận khi inputs và cwd thật sự phủ toàn bộ source và test của dự án (hoặc đúng package được kiểm).
- **Tiêu chí nghiệm thu:** 3 tiêu chí

## Supporting Artifacts

- [`research.md`](./research.md) — Khảo sát công nghệ & đối sánh giải pháp.
