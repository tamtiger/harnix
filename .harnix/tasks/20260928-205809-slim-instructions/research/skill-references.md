# Research — Cách nạp reference của skill trên các nền tảng

- **Task:** 20260928-205809-slim-instructions
- **Ngày:** 2026-09-30
- **Unknown cần quyết định:** phục vụ nội dung dài của skill (reference) bằng file cài cạnh `SKILL.md` (chuẩn Agent Skills) hay bằng lệnh `harnix skill <tên> --reference <chủ đề>`?

## Nguồn

| Nguồn | Phiên bản/ngày | Dùng cho |
| --- | --- | --- |
| https://agentskills.io/specification | đọc 2026-09-30 | thư mục tùy chọn, nạp ba lớp, giới hạn |
| https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview và /best-practices | đọc 2026-09-30 | model đọc file phụ bằng công cụ, tránh lồng sâu |
| https://code.claude.com/docs/en/skills | đọc 2026-09-30 | `${CLAUDE_SKILL_DIR}`, cắt listing ở 1.536 ký tự, nén giữ 5.000 token đầu |
| https://learn.chatgpt.com/docs/build-skills (từ developers.openai.com/codex/skills) | đọc 2026-09-30 | Codex nạp tên, mô tả và đường dẫn skill; danh sách skill tối đa 2% cửa sổ |
| https://github.com/anthropics/skills (pdf, mcp-builder) | đọc 2026-09-30 | mẫu câu dẫn tới file phụ |
| https://kiro.dev/docs/skills | trang ngày 2026-09-02 | Kiro nạp file tham chiếu chỉ khi chỉ dẫn yêu cầu |
| https://github.com/kirodotdev/Kiro/issues/6955 | mở 2026-03-30, Kiro 0.11.63, Windows, đóng "not planned" | kích hoạt skill chỉ chèn văn bản SKILL.md, không có đường dẫn thư mục skill; link tương đối phân giải theo workspace root và hỏng với skill global |
| https://github.com/kirodotdev/Kiro/issues/6680 | Kiro CLI 1.28.1, đóng "not planned" | cấu hình `skill://` nạp toàn bộ SKILL.md lúc khởi động |
| https://antigravity.google/docs/skills và https://codelabs.developers.google.com/getting-started-with-antigravity-skills | không ghi ngày | vị trí skill, router theo `description`; tên thư mục phụ khác nhau giữa các nguồn |
| https://discuss.ai.google.dev/t/bug-report-agent-is-unaware-of-global-skills-due-to-missing-path-in-system-prompt/127260 | 2026-02-27, bản 1.19.6 | prompt hệ thống của Antigravity không có đường dẫn skill; chưa rõ ở 2.x |
| mã nguồn repo này (`global-managed-files.ts`, `global-uninstall.ts`, `global-surface.ts`) | working tree 2026-09-30 | chi phí cài reference thành file |

## Bằng chứng trong repo

- Manifest và reconcile chung xử lý file phụ không cần đổi (tạo, cập nhật, giữ bản người dùng sửa, xóa khi lỗi thời).
- Hai chỗ giả định "một skill = một `SKILL.md`": `ownedSkillUnitDirectory` (`global-uninstall.ts:158`) làm `uninstall` để lại thư mục `references/` rỗng; `harnixSkillUnitPath` (`global-managed-files.ts:704`).
- Khoảng 8 file test ghim danh sách file cài đặt chính xác.

## Sự kiện

- Không nền tảng nào tự nạp file cạnh `SKILL.md`; model đọc chúng bằng công cụ file hoặc shell khi `SKILL.md` chỉ dẫn (spec, Claude, Codex, Kiro).
- Claude Code có `${CLAUDE_SKILL_DIR}`; Codex đưa đường dẫn skill vào danh sách; Kiro và Antigravity có báo cáo lỗi về việc thiếu đường dẫn skill khi kích hoạt.
- Skill mẫu của Anthropic dùng câu điều kiện rõ ("read X when Y", "Load ... for ..."), giữ tham chiếu một cấp, file dài trên 100 dòng có mục lục.
- Giới hạn bị ép: `description` ≤ 1.024 ký tự; Claude Code cắt listing ở 1.536 ký tự và giữ 5.000 token đầu của mỗi skill sau khi nén.

## Suy luận (của Harnix, không phải bảo đảm từ nhà cung cấp)

- Cài `references/` thành file và dẫn bằng link tương đối không đáng tin trên Kiro và Antigravity, đúng hai nền tảng cài skill vào thư mục global; trên hai nền tảng đó model không biết thư mục skill nên không phân giải được đường dẫn.
- Lệnh `harnix skill <tên> --reference <chủ đề>` không phụ thuộc đường dẫn, chạy giống nhau trên cả bốn nền tảng (đều có shell) và luôn khớp phiên bản Harnix đang cài, không có nguy cơ lệch giữa file đã cài và catalog.
- Cài thêm file cho nền tảng đọc được sẽ nhân đôi nguồn sự thật, tăng bề mặt manifest/uninstall và test, mà không thêm độ tin cậy ở nơi cần nhất.

## Kết luận

Giữ **lệnh làm cơ chế duy nhất**, không cài reference thành file. Áp thực hành tốt nhất từ nghiên cứu: mọi chỗ nhắc reference ghi đủ lệnh `harnix skill <tên> --reference <chủ đề>` kèm điều kiện "nạp khi"; `SKILL.md` tự đủ cho ca thường gặp; reference một cấp, không lồng; test đảm bảo mọi lệnh nhắc tới reference tồn tại và mọi reference được nhắc; test giới hạn `description` ≤ 1.024 ký tự.

## Tác động

Không đổi kế hoạch hay obligation của task; củng cố quyết định `d-skill-references`. Không phải sửa manifest, uninstall hay danh sách file cài đặt.

## Còn bất định và điều kiện xem lại

- Chưa xác nhận Antigravity 2.x và Kiro bản mới còn thiếu đường dẫn skill hay không; xem lại nếu hai nền tảng công bố biến tương đương `${CLAUDE_SKILL_DIR}`.
- Chưa đọc mã nguồn Codex nên chưa biết nó có cắt thân `SKILL.md` khi nạp hay không.
- Chưa kiểm tra tài liệu steering của Kiro.
- Rủi ro còn lại: agent phải chạy lệnh khi gặp điều kiện; giảm bằng câu điều kiện ngay trong skill và test nhắc đủ lệnh.
