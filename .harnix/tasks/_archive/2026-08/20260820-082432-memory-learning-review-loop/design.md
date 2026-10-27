# Design — Explicit project-local learning loop

## Data flow

`harnix-finish-work` đọc bounded `harnix mem` output, xác định một statement lặp lại có source task/evidence cụ thể, rồi gửi candidate-only envelope vào hidden `workflow --learn`. Command resolve active task/config, revalidate finishing freshness và provenance, tạo `LearningCandidateV1`, phân tích risk category, append một `JournalEntryV1` idempotent và giữ nguyên task/active pointer. `harnix mem --learning` chỉ đọc/filter các entry đó. Promotion proposal và spec diff vẫn là action explicit tách biệt.

## Provenance rules

- Current active task bắt buộc xuất hiện trong `sourceTaskIds` và ở `verifying/finishing` với completion prerequisites fresh.
- Source task khác phải load được như valid `completed` task; terminal `cancelled`, unfinished, missing, corrupt hoặc future schema bị reject.
- Mỗi source task phải đóng góp ít nhất một ID nằm trong `evidenceIds`; mọi ID được validate từ task records, không nhận caller-supplied path.
- Distinct task/evidence threshold và confidence dùng đúng frozen formula; caller không điều khiển derived/status fields.

## Persistence and retry

Entry ID deterministic theo current task ID và candidate ID. Trước append, command tìm exact ID trong project-local journal: identical normalized candidate trả existing entry với `created:false`; khác statement hash hoặc provenance trả conflict. New append dùng cơ chế journal hiện có và không rewrite line/file cũ.

## Trust boundary

Statement tối đa 64 KiB, được hash và scan bằng learning-safety hiện có. CLI chỉ trả sorted finding categories, không matched values. Journal content vẫn là user-owned untrusted data; downstream proposal chỉ render qua fixed `Statement-JSON` boundary. Không execute URL/command, không network và không tự promotion.

## Compatibility and rollback

Default `mem` và schemas v1 không đổi; `--learning` là filter additive. Rollback có thể bỏ hidden action/filter/guidance mà không migrate dữ liệu vì entry mới vẫn là valid `JournalEntryV1`. Historical completion journal được byte-preserve và không backfill.
