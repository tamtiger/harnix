# PRD: Tham chiếu chéo trong --batch không phụ thuộc thứ tự

## Hiện trạng

`--batch` áp checks rồi criteria lên bản sao và chỉ validate khi lưu, nên thứ tự các mục trong envelope vốn không quan trọng; các kịch bản tiêu chí trỏ tới check cùng batch và check trỏ tới tiêu chí cùng batch đều chạy được. Điểm còn thiếu: tham chiếu tới id không tồn tại bị `mapCriterionToChecks` bỏ qua im lặng và chỉ lộ ra sau đó bằng lỗi coverage hoặc validation chung, không nêu id thiếu và chỉ báo từng vấn đề.

## Phạm vi

- Sau khi áp toàn bộ mục, kiểm mọi tham chiếu `criteria[].checks` và `checks[].criteria`; lỗi nêu mọi id thiếu trong một thông báo.
- Test hồi quy cho cả hai chiều tham chiếu trong cùng batch và cho báo lỗi gộp.
- Cookbook ghi rõ batch không phụ thuộc thứ tự.

## Không thuộc phạm vi

Không nới luật mỗi tiêu chí phải có check bắt buộc phủ; không đổi luật bất biến sau ready.

## Tiêu chí chấp nhận

### ac-1: Áp hết rồi mới validate

Criteria trỏ check cùng batch và check trỏ criteria cùng batch đều hợp lệ, bất kể thứ tự trong envelope.

**Verifies:** `check-batch` cùng `check-suite`.

### ac-2: Lỗi tham chiếu thiếu

Tham chiếu tới id không tồn tại báo rõ id thiếu, mọi vấn đề độc lập trong một lần báo, và không ghi gì.

**Verifies:** `check-batch` cùng `check-suite`.

### ac-3: Kịch bản `--set-check` với tiêu chí vừa thêm

Một `--batch` vừa thêm criterion vừa khai check phủ nó (kịch bản Task digest) không cần hai lệnh theo thứ tự cố định; có test hồi quy.

**Verifies:** `check-batch` cùng `check-suite`.

### ac-4: Cookbook

Cookbook của template workflow ghi batch không phụ thuộc thứ tự.

**Verifies:** `check-docs` cùng `check-suite`.
