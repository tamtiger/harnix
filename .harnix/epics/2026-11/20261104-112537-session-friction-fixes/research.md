# Nghiên cứu: token của skills và references

Đo ngày 2026-11-04 trên bản `2.26.1` (xấp xỉ 4 ký tự một token, giống `instruction-budget` và `measure:tokens`). Đây là đầu vào cho quyết định có tạo task giảm token hay không; task này không sửa code.

## 1. Số đo

**Khối luôn nạp và tài liệu workflow** (`pnpm measure:tokens`): khối luôn nạp 1457 token (trần 1500), `workflow.md` 2451, một phiên Lite đầy đủ 9170. Một task Full nạp khoảng 9500 (khối luôn nạp + `workflow.md` + plan + implement + verify) so với trần 15000 của `instruction-budget`, nên còn dư khoảng 37%.

**13 `SKILL.md`** (tổng 13710 token, trần 1800 mỗi skill):

| Skill | Token | Skill | Token |
| --- | ---: | --- | ---: |
| `harnix-plan` | 1798 | `harnix-security-lens` | 826 |
| `harnix-verify` | 1774 | `harnix-migration-safety` | 818 |
| `harnix-implement` | 1643 | `harnix-sequential-thinking` | 679 |
| `harnix-debug` | 1149 | `harnix-flaky-test` | 677 |
| `harnix-review` | 1052 | `harnix-bugfix-preserve` | 540 |
| `harnix-research` | 993 | `harnix-arch-review` | 890 |
| | | `harnix-verification-gap` | 871 |

`harnix-plan` (1798) và `harnix-verify` (1774) sát trần 1800, nên mọi dòng thêm vào phải đổi một dòng khác.

**36 reference** (tổng 23479 token; nặng nhất theo skill: `harnix-verify` 7175, `harnix-plan` 5789, `harnix-arch-review` 2354, `harnix-implement` 2299). Lớn nhất từng file: `arch-review/domain-briefs` 1615, `plan/epic` 1501, `implement/dotnet-microservices` 1106, `verify/evidence` 1072, `verify/gates` 1032.

## 2. Tần suất nạp thật

Đếm lệnh `harnix skill` trong 37 transcript Claude Code của repo này (chỉ có Claude Code; không có số liệu Codex, Kiro, Antigravity, OpenCode, Cursor):

| Skill | Lần nạp | Token nạp (lần x kích thước) |
| --- | ---: | ---: |
| `harnix-plan` | 59 | khoảng 106000 |
| `harnix-implement` | 28 | khoảng 46000 |
| `harnix-verify` | 11 | khoảng 20000 |
| `harnix-review` | 5 | khoảng 5000 |
| `harnix-research` | 2 | khoảng 2000 |

Reference nạp 42 lần: `plan/epic` 9 (khoảng 13500 token), `plan/ready-review` 5, `plan/replan` 4, `plan/multi-repo` 4, `plan/plan-critique` 3, `verify/cookbook-commands` 3. Các skill còn lại gần như không được nạp.

Hai điều rút ra: (1) `harnix-plan` là chi phí lớn nhất vì được nạp ở gần như mọi task và lại nạp lại sau mỗi lần replan; (2) agent hiếm nạp `harnix-verify` (11 lần so với 28 lần implement), nên phần hướng dẫn verify thực tế ít đến tay agent.

## 3. Chi phí khác ngoài skill

- Đầu ra `harnix skill <name>` mặc định là JSON: so với `--raw`, mỗi lần nạp thừa khoảng 450 đến 520 byte (khoảng 112 đến 130 token): trường `description` và frontmatter bị lặp trong `content`, cộng ký tự escape. Một task Full nạp 3 skill nên thừa khoảng 350 token.
- Trong session này, đầu ra các lệnh harnix tôi đọc (đã lọc bằng `cut`) cộng khoảng 41760 token, lớn hơn nhiều so với 9500 token skill của một task Full. Đáng chú ý: `doctor` lặp hàng chục finding giống hệt (đã có task `doctor-journal-finding-dedupe`), `resume` và `workflow --transition` chưa `--brief` khi thử và lỗi.
- `preflight` kèm tối đa 5 ghi chú learning ở trạng thái draft (khoảng 200 token) mỗi lần gọi ở bước planning.

## 4. Phương án

**A. Cắt phần lặp trong đầu ra `harnix skill` (không đổi nội dung skill).** Bỏ frontmatter khỏi `content` vì `description` đã là một trường riêng. Tiết kiệm khoảng 70 đến 130 token mỗi lần nạp, khoảng 350 mỗi task Full, nhiều nhất là với `harnix-plan` (59 lần). Rủi ro thấp: đổi `content` của một lệnh công khai nên cần cập nhật hợp đồng, PRD và test `skill-sources`.

**B. Rút gọn `harnix-plan/SKILL.md` và chuyển phần ít dùng sang reference.** Mục tiêu giảm 15 đến 20% (khoảng 300 token mỗi lần nạp), tương đương khoảng 18000 token trên 59 lần nạp. Rủi ro: phần bị chuyển ra có thể bị agent bỏ qua (cần giữ lại một dòng trỏ tới reference và test `skill-sources` kiểm mỗi reference có một dòng trỏ). Cần xem lại từng đoạn theo checklist của `.harnix/spec/skills/harnix-self-host`.

**C. Rút gọn reference nặng, nạp nhiều: `plan/epic` (1501, nạp 9 lần).** Giảm tối đa khoảng 500 token mỗi lần nạp. Lợi ích nhỏ hơn B (khoảng 4500 token), rủi ro làm mất quy tắc epic đang bắt buộc.

**D. Không làm gì ở skill, chỉ giảm đầu ra lệnh.** Mặc định `--brief` cho mọi lệnh ghi đã có; phần còn lại là doctor (đang có task) và `preflight` learning. Chi phí lớn nhất thực tế nằm ở đầu ra lệnh, không ở skill.

## 5. Khuyến nghị

1. Làm **A** (rẻ nhất, an toàn, lợi ích chắc chắn).
2. Làm **B** cho `harnix-plan` vì nó chiếm khoảng một nửa tổng token skill được nạp; không làm cho skill hiếm dùng (debug, review, research, các skill chuyên biệt).
3. Chưa làm **C**; đo lại sau B.
4. Không thêm telemetry để đếm tần suất nạp (vi phạm ranh giới sản phẩm); số liệu transcript ở trên là đủ để quyết định.

Việc tiếp theo cần người dùng duyệt: tạo task thực hiện cho A và B (mỗi task một bản vá hoặc dev của epic này) hay để riêng.
