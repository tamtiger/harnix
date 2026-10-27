# Baseline bất biến trước khi Việt hóa

Baseline được ghi trước khi sửa task nguồn. Phép chiếu `task.json` loại bỏ riêng các trường văn xuôi được phép dịch (`title`, `goal`, `nonGoals`, `acceptanceCriteria[].text`, `validationPlan[].description`, `evidence[].summary`) và giữ toàn bộ dữ liệu kỹ thuật còn lại.

- SHA-256 phép chiếu kỹ thuật của `task.json`: `65024f96705cd0a97b504506237cc0fc12b7c45836b4d58cc7054723975b1f8d`
- `prd.md`: `2d9719e63d64486167ed52aef9b9f45da7d1ffe849d85137e99e90c2ab43566f` — 0 code fence, 5 inline literal, 0 URL, 0 dòng bảng.
- `plan.md`: `8f7a671a65bee26a6c2de146a38c79bee8ad6879962bcb5aaf901eead0a1640b` — 4 code fence, 99 inline literal, 0 URL, 0 dòng bảng.
- `research/01-supported-platform-and-baseline-mechanisms.md`: `017eee68d66cd3031e4d361eeb54d07b07b367f365890c1cfd2052c15c2c217a` — 0 code fence, 22 inline literal, 13 URL, 9 dòng bảng.
- `research/02-current-harness-mechanisms.md`: `12cb4c7e3cf108b1a6fac0534151fcf927ca7b6b7953b9002df090ff767b1c72` — 0 code fence, 31 inline literal, 18 URL, 13 dòng bảng.
- `research/03-capability-decisions.md`: `e5c17abd76e476ad85dd31abaf81b389178d102e27262e0f7455988208e25460` — 0 code fence, 81 inline literal, 18 URL, 71 dòng bảng.

Hash Markdown được tính trên code fence, inline literal, URL và số dòng bảng theo đúng thứ tự. Bản dịch phải tái tạo chính xác các hash này.
