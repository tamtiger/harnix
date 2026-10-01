# Plan - Sửa backlog lỗi do Harnix gây ra

Task giữ ở `planning`: bảng backlog trong `prd.md` còn được bổ sung sau mỗi task chạy thêm.

## Slices

- [ ] S1. Chốt phạm vi cùng người dùng: với từng hàng HX-nn chọn sửa hoặc từ chối (ghi lý do vào bảng), thêm các hàng mới phát sinh, rồi mới chuyển `ready`.
- [ ] S2. Sửa theo test trước cho từng hàng đã chọn: thông báo lỗi (HX-01, HX-02), `update` (HX-03, HX-04), hook (HX-05), hướng dẫn (HX-06, HX-07), `run-check --brief` (HX-08). Mỗi hàng có test RED rồi GREEN; hàng chạm contract thì cập nhật PRD, WORKFLOW, IMPLEMENTATION_PLAN.
- [ ] S3. Đồng bộ và phát hành: tài liệu, `pnpm version:sync` lên `2.0.0-dev.x` kế tiếp, CHANGELOG, `pnpm format`, build, `measure:tokens` nếu chạm token.

## Kiểm chứng

Check hẹp theo từng hàng khi triển khai, rồi một lần `chk-suite`.

## Rủi ro

Xem PRD.
