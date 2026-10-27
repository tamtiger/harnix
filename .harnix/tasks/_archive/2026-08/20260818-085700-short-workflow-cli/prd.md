# PRD — Rút gọn CLI persistence workflow

## Outcome

Agent dùng namespace workflow ngắn hơn cho bốn thao tác persistence/freshness, nhưng transport vẫn hidden và JSON-only trừ khi quyết định khác được ghi rõ.

## Phạm vi

- Đổi registration CLI, canonical skills, consumer templates, docs và tests.
- Giữ nguyên semantics inspect/save/snapshot/finish.
- Cập nhật release metadata trước completion.

## Quyết định cần người dùng chốt

Yêu cầu người dùng chốt thay hoàn toàn namespace cũ: không giữ `harnix internal workflow ...` compatibility alias. Namespace mới là `harnix workflow ...`; nó vẫn hidden, JSON-only và không phải supported public API.

## Không thuộc phạm vi

- Không đổi `harnix internal context` hook protocol.
- Không đổi schema TaskRecord hay transition/freshness algorithm.