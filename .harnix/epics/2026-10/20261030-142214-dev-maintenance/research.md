# Nghiên cứu: footprint và thời gian test

Số liệu đo ngày 2026-10-30 trên bản `2.24.0` (build hiện tại, thư mục home cô lập). Đây là dữ liệu đầu vào cho hai member
`footprint-skill-references` và `speed-up-slow-tests`; chưa có thay đổi code nào.

## 1. Footprint (mức trần `maxBytes` 699000, đang 698148, còn dư 852 byte)

`harnix setup --kiro --antigravity --codex` ghi 698148 byte. Phân rã theo thư mục (byte):

| Nguồn | Byte | Ghi chú |
| --- | ---: | --- |
| `.gemini/config/plugins` (Antigravity Desktop) | 169325 | skill và manifest của plugin |
| `.gemini/antigravity-cli/plugins` (Antigravity CLI) | 169321 | bản sao thứ hai của cùng skill |
| `.agents/skills/harnix-*` (Codex) | 148528 | 14 skill, gồm cả `references/` |
| `.kiro/skills/harnix-*` | 148528 | cùng nội dung |
| `.kiro/harnix/managed.json` | 14660 | manifest hash |
| `.agents/harnix/managed.json` | 14578 | manifest hash |
| `AGENTS.md` / steering / config | khoảng 12000 | khối hướng dẫn luôn nạp |

Nguồn gốc trong repo: `src/skills` nặng 159567 byte, trong đó `references/` là 93696 byte (51 file toàn bộ, 14 `SKILL.md`
chiếm khoảng 66 KB). Mỗi byte thêm vào một skill được ghi bốn lần (Codex, Kiro, hai plugin Antigravity), nên 852 byte
dư tương đương khoảng 200 byte nội dung skill.

`harnix skill <name> --reference <topic>` đã phục vụ nội dung references theo yêu cầu từ gói cài đặt, nên bản sao
references trong từng nền tảng chỉ được dùng nếu agent đọc file trực tiếp.

### Phương án

- **A. Không chép `references/` vào nền tảng; chỉ chép `SKILL.md`, references lấy qua `harnix skill --reference`.**
  Giảm khoảng 94 KB x 4 = 375 KB (54%). Rủi ro: agent không có `harnix` trên PATH mất references (nhưng khi đó
  workflow đã dừng theo AGENTS); `update --global` phải dọn thư mục `references/` cũ do Harnix sở hữu và giữ file người
  dùng sửa; test footprint, `skill-sources` và `docs-task-contract` đang giả định references nằm trong skill.
- **B. Giữ nguyên, nâng `maxBytes` có lý do trong changelog.** Rẻ nhất, nhưng mỗi lần thêm nội dung lại chạm trần.
- **C. Gộp hai plugin Antigravity dùng chung một bản skill.** Không khả thi: hai plugin có root và manifest độc lập
  theo hợp đồng (Desktop và CLI không phụ thuộc nhau).

### Khuyến nghị

Phương án A, làm thành một task riêng sau khi người dùng duyệt, vì nó đổi bố cục cài đặt toàn cục và cần migration
cho `update --global`. Trong lúc chờ, không thêm nội dung vào skill; nếu bắt buộc, dùng B với lý do ghi trong changelog.

## 2. Thời gian test

`vitest run` cả suite: 348 file, 2733 test, tường 82 s, tổng thời gian file 838 s. 20 file chậm nhất chiếm 44%.

| File | Thời gian (s) | Số test |
| --- | ---: | ---: |
| `test/workflow/learning-automation.test.ts` | 43.2 | 12 |
| `test/unit/utils/git.test.ts` | 29.5 | 9 |
| `test/unit/core/workflow/plan-edit.test.ts` | 23.7 | 16 |
| `test/integration/commands/workflow-command.test.ts` | 22.6 | 17 |
| `test/unit/commands/global-uninstall.test.ts` | 19.5 | 9 |
| `test/unit/core/workflow/init-task.test.ts` | 18.4 | 33 |
| `test/unit/core/workflow/run-check.test.ts` | 18.2 | 15 |
| `test/unit/core/workflow/finish.test.ts` | 18.2 | 15 |
| `test/integration/commands/workflow-handlers.test.ts` | 17.8 | 19 |
| `test/unit/core/workflow/criterion.test.ts` | 16.4 | 11 |

Các số này là thời gian chạy song song nên cao hơn khi chạy riêng. Nguyên nhân khả dĩ (chưa đo từng cái): mỗi test
dựng một repo tạm bằng `initializeProject` hoặc `git init`, và dùng tiến trình con. Hướng thử: dựng một repo mẫu một
lần cho mỗi file rồi sao chép, gom các test `git` dùng chung repo chỉ đọc, và đo lại bằng
`vitest --reporter=json`. Mục tiêu đặt trong tiêu chí: giảm tối thiểu 30% tổng thời gian CPU của 10 file đầu.

## Cập nhật 2026-10-30 (sau quyết định của người dùng)

- **Footprint:** người dùng quyết định bỏ giới hạn byte của `harnix setup` (đó là kích thước cài đặt, không phải chi phí
  token); phần tối ưu tập trung vào token của skill và reference, đã có `instruction-budget`. Phương án A ở mục 1 không
  còn cần thiết cho footprint và chỉ còn giá trị nếu muốn giảm token nạp, chưa lên task.
- **Thời gian test:** đo từng file chạy riêng cho thấy chậm trong suite là do tranh chấp tài nguyên, không do nội dung test.

  | File | Trong suite (s) | Chạy riêng (s) |
  | --- | ---: | ---: |
  | `test/unit/utils/git.test.ts` | 29.5 | 2.2 |
  | `test/workflow/learning-automation.test.ts` | 43.2 | 10.7 |
  | `test/unit/core/workflow/plan-edit.test.ts` | 23.7 | 6.1 |

  Cả suite theo số worker (12 lõi, mặc định 12 worker): 4 worker 87 s (CPU test 320 s), 8 worker 68 s (483 s),
  12 worker 89 s (964 s). Mỗi cấu hình đo một lần nên cần đo lại nhiều lần trước khi chốt. Giải pháp: đặt `maxWorkers`
  (khởi điểm 8), thay cho hướng tối ưu từng test; member `speed-up-slow-tests` đã đổi theo hướng này.

### Kết quả đo lại ngày 2026-10-30 (thay cho số liệu worker ở trên)

Lần đo đầu (một lần mỗi cấu hình, 8 worker 68 s) là nhiễu. Đo sạch, ba lần mỗi cấu hình: 6 worker 80/77/77 s, 12 worker 83/81/98 s, 8 worker 73/91/111 s. Đo xen kẽ ba cặp: 12 worker 82/79/80 s, 6 worker 75/76/80 s. Kết luận: `maxWorkers: 6` nhanh hơn khoảng 4 đến 10% và ổn định hơn, không phải 24%. Nguyên nhân gốc của việc file chạy chậm gấp 4 đến 13 lần trong suite chưa xác định (tranh chấp đĩa hoặc quét của antivirus trên thư mục tạm là giả thuyết, chưa đo).
