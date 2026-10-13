# Gộp gần trùng learning

## Vấn đề

`observationCandidateId` băm chuỗi đã chuẩn hoá (chữ thường, gộp khoảng trắng, bỏ dấu câu ở hai đầu) nên hai ghi chú cùng ý nhưng khác dấu tiếng Việt (`Luôn chạy test` và `Luon chay test`) trở thành hai candidate riêng và không bao giờ hội tụ. Người duyệt cũng không có gợi ý nào về mục gần trùng khi chạy `harnix learning`.

Dữ liệu nghiên cứu (130 mục) cho thấy chỉ có 1 cặp gần trùng ở ngưỡng Jaccard 0,5, nên mục tiêu "tăng số candidate hội tụ" không thực tế. Phạm vi được thu hẹp (quyết định `d-scope-c`): gấp dấu vào khoá gộp và gợi ý trùng khi review.

## Mục tiêu

- Capture gộp biến thể chỉ khác dấu, hoa thường hoặc dấu câu vào cùng một candidate hiện có, giữ nguyên id của candidate đó (`d-id-stable`).
- `harnix learning` và `harnix learning --promote` trả thêm `similar`: các id gần trùng (Jaccard từ 0,5 trên token đã bỏ dấu) để người duyệt quyết định.
- Đo trước và sau trên journal thật của repo này.

## Không làm

- Không thêm dependency, không đổi schema entry journal v1, không đổi công thức id, không đổi ngưỡng candidate (`d-threshold`).
- Không tự gộp hoặc từ chối theo độ tương tự: gợi ý chỉ để người duyệt xem.

## Tiêu chí chấp nhận

- ac-1: hai ghi chú cùng ý chỉ khác dấu, hoa thường hoặc dấu câu được capture vào cùng một candidate, giữ id đã có, có test fixture tiếng Việt.
- ac-2: entry cũ vẫn đọc được, id của candidate hiện có không đổi, id mới vẫn tính bằng cùng công thức băm.
- ac-3: `harnix learning` và `--promote` trả `similar`, có test precision/recall trên fixture tiếng Việt.
- ac-4: báo cáo số liệu trước và sau trên journal thật, ghi vào evidence.

## Rủi ro

- Khoá bỏ dấu có thể gộp hai câu khác nghĩa chỉ khác dấu (hiếm với câu dài từ 40 ký tự); candidate giữ nguyên statement đầu tiên nên không mất nội dung.
- So khớp cặp là O(n²) trên tối đa 500 entry; giới hạn bằng số entry đọc sẵn có và chỉ tính cho mục được liệt kê.
- Rollback: gỡ module `learning-similarity.ts` và hai chỗ gọi; id và journal không đổi nên không cần migration.
