# Research: đại tu tính năng learning

Phạm vi: chỉ đọc. Dữ liệu: journal thật của repo này (136 entry, 130 id duy nhất, 49 task nguồn, 2026-09-29 → 2026-10-08). Số liệu do script đọc journal tính tại chỗ, không ghi gì.

## Kết luận chính (đảo lại hai giả định ban đầu)

1. **Giả định "capture nhiều rác" sai phần lớn.** Chỉ 1/130 mục quá ngắn. 82/130 là bài học tổng quát có giá trị, 23/130 gắn chặt một task cụ thể, và 24/130 viết không dấu hoặc bằng tiếng Anh nhưng vẫn có giá trị. Vì vậy KHÔNG được lọc theo "không có dấu".
2. **Giả định "gộp gần trùng sẽ làm draft hội tụ" cũng sai.** So khớp token đã bỏ dấu, Jaccard ≥ 0,5 chỉ tìm ra 1 cặp trong 130 mục (≥ 0,3 là 6 cặp, 124 cụm). Các bài học thật sự khác nhau, nên cơ chế "cần ≥ 2 task lặp lại" gần như không bao giờ kích hoạt trừ khi agent chép nguyên văn (ca 7 source).
3. **Vấn đề thật là thiếu bước áp dụng và chọn lọc sai.** Không có đường duyệt hay promote; kênh prompt chỉ chọn 5 mục theo "candidate trước, rồi mới nhất", không liên quan gì tới việc task hiện tại đang sửa file nào. Preflight thực tế đã cho thấy: top-5 gồm ghi chú về định dạng `review.md` và việc phát hành 2.3.0, không liên quan tới task học tính năng learning.
4. **Có dữ liệu để chọn theo độ liên quan:** 97/130 learning có task nguồn với `relevantPaths` (nhiều nhất `src/core/workflow` 52, `src/templates/harnix` 32, `src/core/tasks` 23). Có thể chấm điểm theo giao nhau với `relevantPaths` của task đang lập kế hoạch.

## R1. Phân loại 130 learning

| Nhóm | Số lượng | Ghi chú |
| --- | --- | --- |
| Tổng quát, tái sử dụng được | 82 | giữ |
| Gắn task cụ thể (mã task, "task này", epic, member, ac-N, check-x, số phiên bản) | 23 | nên giảm ưu tiên, không xoá |
| Không có dấu (tiếng Anh hoặc tiếng Việt không dấu) | 24 | phần lớn vẫn có giá trị; không được coi là rác |
| Quá ngắn (< 40 ký tự) | 1 | ví dụ "Kiem tra render moi" |
| Bị cắt "…" | 0 | |

Độ dài statement: nhỏ nhất 19, trung vị 159, lớn nhất 482. Trung bình chưa tới 3 mục mỗi task (tối đa 5 do giới hạn).
Trạng thái: 129 `draft`, 1 `candidate`, 0 `approved`/`promoted`/`rejected`.

## R2. Cách các harness khác áp dụng bài học (từ kiến thức sẵn có, chưa tra cứu mạng nên chưa kiểm chứng nguồn mới nhất)

- Claude Code (CLAUDE.md, memory), Cursor rules, Codex AGENTS.md, Kiro steering đều dùng một mô hình chung: bài học chỉ có tác dụng khi được **viết thành một tệp quy tắc mà người dùng sở hữu và duyệt**, rồi được nạp theo phạm vi (toàn cục, theo thư mục, theo glob tệp). Không hệ nào tự động ghi quy tắc mà không có người duyệt.
- Cursor có quy tắc theo glob; Kiro có steering theo điều kiện; Claude Code có `CLAUDE.md` theo thư mục. Điểm chung: **nạp theo đường dẫn đang làm việc**, không nạp theo độ mới.
- Ràng buộc Harnix (không telemetry, không global memory, không mạng, không tự ghi spec) loại bỏ mọi hướng tự động. Phù hợp nhất: đề xuất → người duyệt → ghi vào `.harnix/spec/guides` (đã có cơ chế guide chọn theo `appliesTo`).

## R3. Kỹ thuật gộp gần trùng offline

Thử trên 130 mục (bỏ dấu NFD, tách token, Jaccard theo token):

| Ngưỡng | Số cặp | Số cụm | Cụm > 1 mục | Cụm lớn nhất |
| --- | --- | --- | --- | --- |
| ≥ 0,3 | 6 | 124 | 5 | 3 |
| ≥ 0,4 | 2 | 128 | 2 | 2 |
| ≥ 0,5 | 1 | 129 | 1 | 2 |
| ≥ 0,6 | 0 | 130 | 0 | 1 |

Cặp duy nhất ở 0,58 là hai ghi chú cùng nói về việc golden snapshot sinh lại; hợp lý khi gộp. Kết luận: gộp theo token **chỉ phù hợp để gợi ý trùng khi người duyệt, không phải cách làm draft thành candidate**. Gộp bằng embedding bị loại (cần mô hình/mạng). Việc nên làm rẻ: gấp dấu (diacritic folding) vào khoá chuẩn hoá để cùng nội dung có dấu/không dấu trùng nhau.

## R4. Tiêu chí "bài học tái sử dụng được"

Tín hiệu rẻ, deterministic: độ dài ≥ 40 ký tự; không chứa mã task/epic hoặc "task này"; không chứa chuỗi kiểm thử (nhãn kiểu "Kiem tra ..."); có động từ khuyến nghị hoặc điều kiện. Dùng làm **điểm ưu tiên**, không dùng làm bộ chặn cứng (vì 24 mục không dấu và 23 mục gắn task vẫn có thể hữu ích). Một cờ `reusable` do agent khai báo ở `--add-decision`/`--add-risk` sẽ chạm contract schema, nên để tuỳ chọn và hoãn.

## R5. Đường áp dụng

| Phương án | Giá trị | Rủi ro | Chi phí |
| --- | --- | --- | --- |
| (a) Diff đề xuất vào `.harnix/spec/guides/*`, chờ duyệt | cao nhất: bài học trở thành quy tắc lâu dài | thấp nếu có approval; statement vẫn là dữ liệu untrusted trong khung cố định | trung bình, `promotionProposal` đã có |
| (b) Nạp theo `relevantPaths` thay vì độ mới, ở stage planning | cao, chi phí token không đổi (vẫn tối đa 5) | thấp | thấp |
| (c) Doctor/lint nhắc learning chưa duyệt | trung bình | thấp | thấp |

Khuyến nghị: **(a) + (b)**, (c) tuỳ chọn. Với (a) cần thêm vòng đời review/approve/reject/promote, ghi trạng thái bằng entry mới vào journal (append-only).

## Khuyến nghị điều chỉnh epic

- **Member A (vòng đời promote): giữ, ưu tiên cao nhất.** Thêm xếp hạng theo độ liên quan `relevantPaths` cho kênh prompt.
- **Member B (chất lượng capture): giảm phạm vi.** Chỉ chặn mục < 40 ký tự và chuỗi kiểm thử; KHÔNG chặn theo "không dấu"; chấm điểm giảm ưu tiên cho mục gắn task cụ thể. Dọn draft rác (khoảng 1–2 mục) bằng entry `rejected` mới.
- **Member C (gộp gần trùng): thu hẹp.** Chỉ gấp dấu vào khoá chuẩn hoá và hiển thị gợi ý trùng (Jaccard ≥ 0,5) khi review; bỏ mục tiêu "tăng số candidate". Tiêu chí ac-3 (số candidate hội tụ tăng) không còn đạt được bằng dữ liệu thật, cần đổi sang "gợi ý trùng đúng".
- Ưu tiên thực hiện nên là A trước, rồi B, rồi C (ngược thứ tự ID hiện tại); nếu giữ thứ tự ID thì A cần dùng được dữ liệu hiện tại ngay.

## Hạn chế của nghiên cứu

- R2 dựa trên kiến thức sẵn có, chưa tra cứu nguồn trực tuyến.
- Phân loại R1 dùng heuristic regex; "tổng quát" và "gắn task" là xấp xỉ, không phải nhãn do người gán.
- Mẫu chỉ gồm một repo và một developer.
