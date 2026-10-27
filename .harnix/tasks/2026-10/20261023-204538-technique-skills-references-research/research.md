# Báo cáo Nghiên cứu: Cẩm nang Chuyên sâu cho 6 Technique Skills & Cơ chế Reference Động

## 1. Mục tiêu và Bối cảnh
Harnix cung cấp 7 technique skills phục vụ các bài toán kỹ thuật chuyên biệt (arch-review, bugfix-preserve, flaky-test, migration-safety, security-lens, sequential-thinking, verification-gap). Trong đó, `harnix-arch-review` đã có 2 references chuyên sâu (`domain-briefs`, `wbs-consolidation`).
Nhiệm vụ của nghiên cứu này là khảo sát mô hình kiến trúc thực tế, xây dựng đề cương cẩm nang chi tiết và cấu trúc hóa hệ thống reference cho 6 technique skills còn lại, đảm bảo:
- **Tính thực chiến**: Cung cấp nguyên tắc kỹ thuật sâu sắc, công thức, mã ví dụ minh họa và quy trình từng bước.
- **Tối ưu ngữ cảnh (Context Economy)**: Reference chỉ được nạp theo yêu cầu khi dùng lệnh `harnix skill <name> --reference <topic>`, không làm phình to instruction tokens của skill chính (giữ token của `SKILL.md` luôn <= 1200 tokens theo quy chuẩn).
- **Tính mở rộng**: Cơ chế đăng ký trong `src/skills/technique-skills.ts` chuẩn hóa và đồng nhất.

---

## 2. Khảo sát & Đề cương Chi tiết cho 6 Technique Skills

### 2.1. `harnix-bugfix-preserve`: Invariant Debugging (`invariant-debugging.md`)
- **Vấn đề cốt lõi**: Khi sửa một bug, rủi ro lớn nhất là tạo ra side-effect phá vỡ các hành vi đúng đắn đã có (break invariants).
- **Đề cương cẩm nang**:
  1. **Invariant Identification**: Cách phân loại System Invariants (bất biến logic nghiệp vụ, bất biến kiểu dữ liệu, bất biến trạng thái chuyển đổi state machine).
  2. **Characterization Testing**: Kỹ thuật viết test "chụp lại" hành vi hiện tại trước khi sửa đổi, bảo đảm vùng biên không bị xê dịch.
  3. **Minimal Failing Reproduction**: Quy tắc tối giản hóa case tái hiện lỗi về một unit test/integration test duy nhất, loại bỏ mọi biến số ngoại lai.
  4. **Regression Boundary Isolation**: Thiết lập ranh giới phòng vệ (guard clauses, defensive assertion) để lỗi không tái diễn.

### 2.2. `harnix-flaky-test`: Concurrency Isolation & Stabilization (`concurrency-isolation.md`)
- **Vấn đề cốt lõi**: Các bài test chập chờn (flaky) thường do race conditions, phụ thuộc thời gian hệ thống, hoặc bất đồng bộ không kiểm soát.
- **Đề cương cẩm nang**:
  1. **Taxonomy of Flakiness**: Phân loại theo 5 nguyên nhân: Asynchronous Timing, Resource Contention, Test Order Dependency, Floating-point/Timezone Drift, External Service Mock Leaks.
  2. **Deterministic Time & Clock Injection**: Kỹ thuật mock clock thay vì dùng sleep/delay tĩnh; cơ chế Virtual Clock.
  3. **Async Polling vs Fixed Sleep**: Chuyển đổi các đoạn sleep cứng sang predicate-based polling với timeout và exponential backoff.
  4. **Shared Mutable State Eradication**: Cô lập test context bằng test fixtures độc lập, reset database/file mock sau mỗi run.

### 2.3. `harnix-migration-safety`: Zero-Downtime Evolution (`zero-downtime-evolution.md`)
- **Vấn đề cốt lõi**: Nâng cấp schema cơ sở dữ liệu hoặc thay đổi định dạng data contract giữa các service mà không làm gián đoạn hệ thống.
- **Đề cương cẩm nang**:
  1. **Expand-Contract Pattern**: 4 giai đoạn tiến hóa (Expand: thêm cột/schema mới; Dual-Write: ghi song song cả cũ và mới; Backfill: đồng bộ dữ liệu cũ; Contract: chuyển đọc sang mới và xóa cũ).
  2. **Database Schema Backward/Forward Compatibility**: Quy tắc thêm cột nullable, default values, tránh rename cột trực tiếp.
  3. **Event Schema Evolution**: Phiên bản hóa message payload (Avro, Protobuf, JSON Schema), quy tắc nới lỏng và bảo toàn trường dữ liệu chưa biết.
  4. **Rollback & Safety Verification**: Chiến lược rollback an toàn, feature flags và shadow testing.

### 2.4. `harnix-security-lens`: Injection & Traversal Guardrails (`injection-traversal-guardrails.md`)
- **Vấn đề cốt lõi**: Các lỗ hổng bảo mật phổ biến nhất khi xử lý file system và input từ người dùng/môi trường ngoài.
- **Đề cương cẩm nang**:
  1. **Canonical Path Traversal Defense**: Chuẩn hóa đường dẫn (canonicalization), chống symlink/junction escape, ràng buộc root pinned directory.
  2. **Safe Process Spawning**: Cấm ghép chuỗi shell trần (shell injection); sử dụng mảng argv tuyệt đối (`execFile`, `spawn` với shell: false).
  3. **Bounded Input Validation**: Ràng buộc kích thước (max payload length), giới hạn ký tự (whitelisting regex), từ chối NUL byte và ký tự điều khiển.
  4. **Secret Isolation**: Nguyên tắc không ghi log bí mật, không lưu credentials vào disk hoặc memory lâu hơn vòng đời yêu cầu.

### 2.5. `harnix-sequential-thinking`: Multi-Step Tree Search (`multi-step-tree-search.md`)
- **Vấn đề cốt lõi**: Giải quyết các bài toán tái cấu trúc kiến trúc phức tạp hoặc gỡ lỗi bí ẩn đòi hỏi lập luận đa nhánh.
- **Đề cương cẩm nang**:
  1. **Tree of Thoughts (ToT) Framework**: Tạo các nút suy nghĩ (thought nodes), mở rộng các nhánh giải pháp (branch expansion).
  2. **Hypothesis Generation & Pruning**: Đánh giá tính khả thi theo các tiêu chí (impact, complexity, risk), loại bỏ sớm các nhánh cụt hoặc rủi ro cao.
  3. **Backtracking Protocol**: Nhận diện dấu hiệu bế tắc (deadlock, circular dependency) và lùi lại bước trước đó một cách có hệ thống.
  4. **Architectural Trade-off Scoring Matrix**: Bảng chấm điểm đánh đổi giữa hiệu năng, độ phức tạp, tính mở rộng và chi phí bảo trì.

### 2.6. `harnix-verification-gap`: Verification Blindspots Detection (`verification-blindspots.md`)
- **Vấn đề cốt lõi**: Bộ test pass 100% nhưng sản phẩm vẫn hỏng do kiểm thử chưa bao phủ đúng vùng rủi ro hoặc assert rỗng.
- **Đề cương cẩm nang**:
  1. **False Success & Tautological Assertions**: Nhận diện các bài test tự thỏa mãn (test không fail khi code logic bị hỏng).
  2. **Boundary & Corner Cases**: Kỹ thuật fuzzing biên (null, undefined, 0, số âm, max integer, chuỗi rỗng, chuỗi UTF-8 đa byte, khoảng trắng).
  3. **Concurrency & High-Load Burst Verification**: Kiểm tra ranh giới khi có hàng trăm request đồng thời hoặc I/O bị nghẽn.
  4. **Mutation Testing Heuristics**: Kiểm tra độ nhạy của bộ test bằng cách biến đổi nhỏ toán tử (ví dụ: `<` thành `<=`, `&&` thành `||`).

---

## 3. Thiết kế Cấu trúc Thư mục và Cơ chế Reference Động

### 3.1. Cấu trúc thư mục
Mỗi skill technique trong `src/skills/` sẽ sở hữu thư mục con `references/`:
```text
src/skills/
├── harnix-bugfix-preserve/
│   ├── SKILL.md
│   └── references/
│       └── invariant-debugging.md
├── harnix-flaky-test/
│   ├── SKILL.md
│   └── references/
│       └── concurrency-isolation.md
├── harnix-migration-safety/
│   ├── SKILL.md
│   └── references/
│       └── zero-downtime-evolution.md
├── harnix-security-lens/
│   ├── SKILL.md
│   └── references/
│       └── injection-traversal-guardrails.md
├── harnix-sequential-thinking/
│   ├── SKILL.md
│   └── references/
│       └── multi-step-tree-search.md
├── harnix-verification-gap/
│   ├── SKILL.md
│   └── references/
│       └── verification-blindspots.md
├── harnix-arch-review/
│   ├── SKILL.md
│   └── references/
│       ├── domain-briefs.md
│       └── wbs-consolidation.md
```

### 3.2. Đăng ký trong `src/skills/technique-skills.ts`
Import các file markdown reference và đưa vào map `canonicalTechniqueSources`:
```typescript
import invariantDebuggingReference from "./harnix-bugfix-preserve/references/invariant-debugging.md";
import concurrencyIsolationReference from "./harnix-flaky-test/references/concurrency-isolation.md";
import zeroDowntimeEvolutionReference from "./harnix-migration-safety/references/zero-downtime-evolution.md";
import injectionTraversalReference from "./harnix-security-lens/references/injection-traversal-guardrails.md";
import multiStepTreeSearchReference from "./harnix-sequential-thinking/references/multi-step-tree-search.md";
import verificationBlindspotsReference from "./harnix-verification-gap/references/verification-blindspots.md";
```
Đăng ký tương ứng trong `canonicalTechniqueSources`.

### 3.3. Tương thích CLI
Khi người dùng chạy:
`harnix skill harnix-bugfix-preserve --reference invariant-debugging`
Lệnh sẽ trả về nội dung Markdown đầy đủ, chuẩn xác, định dạng UTF-8.

---

## 4. Đo lường Ngân sách Token (Token Budget Analysis)
- `SKILL.md` của mỗi technique skill giữ nguyên ngắn gọn (< 1200 tokens) để bảo đảm không vượt `SKILL_BUDGET` (2000 tokens) trong `test/workflow/instruction-budget.test.ts`.
- Các file reference được tải On-Demand, do đó không tiêu tốn token nào trong lượt preflight hoặc bootstrap ban đầu.
- Bản thân mỗi reference có độ dài khoảng 1500 - 3500 từ (phù hợp nạp nhanh khi agent yêu cầu hỗ trợ chuyên sâu mà không vượt giới hạn context window).
