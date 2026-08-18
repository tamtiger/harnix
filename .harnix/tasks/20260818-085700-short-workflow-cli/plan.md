# Plan — Rút gọn CLI persistence workflow

## Checklist triển khai

- [x] Slice 1: chốt compatibility/migration và thêm RED contract tests.
- [x] Slice 2: đổi hidden workflow registration và cập nhật source error/help semantics.
- [x] Slice 3: đồng bộ templates, bảy canonical skills, README và canonical docs.
- [x] Slice 4: bump patch version, CHANGELOG, focused/full verification và completion gates.

## Quyết định chặn

Người dùng cần chọn một trong hai: thay hoàn toàn `harnix internal workflow ...` bằng `harnix workflow ...`, hoặc giữ namespace cũ như hidden compatibility alias. Khuyến nghị giữ alias hidden một patch để integrations đã cài không gãy, nhưng generated guidance chỉ dùng command ngắn.

## Quyết định đã chốt\r\n\r\nThay hoàn toàn `harnix internal workflow ...` bằng `harnix workflow ...`; không giữ alias cũ. Namespace mới tiếp tục hidden và JSON-only.\r\n\r\n## Validation

Mỗi required check dùng snapshot trước/sau; test focused cover registration, transport semantics và generated instructions. Acceptance suite xác minh regression rộng hơn.