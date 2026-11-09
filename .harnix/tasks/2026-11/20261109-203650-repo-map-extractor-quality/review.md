# Nâng chất lượng trích xuất repo-map (extractorVersion 2) cho PHP, C# và symbol lớn

- **ID:** 20261109-203650-repo-map-extractor-quality
- **Mode:** full
- **Epic:** 20261109-194501-repo-map-insights
- **Status:** completed/finishing
- **Created:** 2026-11-09 20:36:49 +07:00
- **Updated:** 2026-11-09 21:51:51 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 12/12 met or waived |
| Required checks | 100% | 4/4 passed |
| Residual risks | 4 | risk-cache-size: medium, risk-regex-limits: low, risk-doctor-invalid-unfixable: low, risk-doctor-extra-scan: low |

## Goal

Sửa nền tảng mà mọi truy vấn repo-map dựa vào: chỉ mục symbol không còn bị cắt theo bảng chữ cái và có thuộc tính C#, import PHP và CodeIgniter được nhận đúng, đồ thị C# nối file với file khai báo kiểu thay vì với .csproj; nâng extractorVersion lên 2 với cơ chế coi cache cũ là stale.

## Non-goals

- Không thêm tree-sitter hay dependency mới.
- Không đổi schemaVersion 1 của RepoMapV1 và đường dẫn cache; chỉ thêm trường tùy chọn và nâng extractorVersion.
- Không hỗ trợ ngôn ngữ mới ngoài những ngôn ngữ extract.ts đã nhận.

## Relevant paths

- `CHANGELOG.md`
- `README.md`
- `docs/HARNIX_PRD.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `src/core/doctor/project.ts`
- `src/core/repo-map/extract-imports.ts`
- `src/core/repo-map/extract-symbols.ts`
- `src/core/repo-map/extract.ts`
- `src/core/repo-map/graph.ts`
- `src/core/repo-map/impact.ts`
- `src/core/repo-map/references.ts`
- `src/core/repo-map/refs.ts`
- `src/core/repo-map/service.ts`
- `src/core/repo-map/store.ts`
- `src/core/repo-map/tests.ts`
- `src/core/repo-map/types.ts`
- `src/core/workflow/context.ts`
- `test/migration/repo-map-extractor-v2.test.ts`
- `test/support/repo-map-fixtures.ts`
- `test/unit/core/repo-map/extract.test.ts`
- `test/unit/core/repo-map/graph.test.ts`
- `test/unit/core/repo-map/impact.test.ts`
- `test/unit/core/repo-map/store.test.ts`
- `test/workflow/self-host.test.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +2 / -2 |
| `docs/HARNESS_RESEARCH.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +3 / -2 |
| `docs/prompts/repo-graph-tools-research.md` | modified | +75 / -35 |
| `package.json` | modified | +1 / -1 |
| `src/commands/repo-map-internal.ts` | modified | +3 / -1 |
| `src/core/repo-map/extract-imports.ts` | added | - |
| `src/core/repo-map/extract-symbols.ts` | added | - |
| `src/core/repo-map/extract.ts` | modified | +39 / -58 |
| `src/core/repo-map/graph-references.ts` | added | - |
| `src/core/repo-map/graph.ts` | modified | +15 / -3 |
| `src/core/repo-map/impact.ts` | modified | +21 / -15 |
| `src/core/repo-map/references.ts` | added | - |
| `src/core/repo-map/refs.ts` | modified | +3 / -2 |
| `src/core/repo-map/service.ts` | modified | +9 / -20 |
| `src/core/repo-map/store.ts` | modified | +50 / -8 |
| `src/core/repo-map/tests.ts` | modified | +3 / -1 |
| `src/core/repo-map/types.ts` | modified | +14 / -1 |
| `src/core/workflow/context.ts` | modified | +2 / -2 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `test/migration/repo-map-extractor-v2.test.ts` | added | - |
| `test/support/repo-map-fixtures.ts` | added | - |
| `test/unit/core/repo-map/extract-imports.test.ts` | added | - |
| `test/unit/core/repo-map/extract-symbols.test.ts` | added | - |
| `test/unit/core/repo-map/extract.test.ts` | modified | +144 / -1 |
| `test/unit/core/repo-map/graph-references.test.ts` | added | - |
| `test/unit/core/repo-map/impact.test.ts` | modified | +8 / -2 |
| `test/unit/core/repo-map/references.test.ts` | added | - |
| `test/unit/core/repo-map/refs.test.ts` | modified | +1 / -0 |
| `test/unit/core/repo-map/store.test.ts` | modified | +7 / -10 |
| `test/workflow/self-host.test.ts` | modified | +1 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): Với một file nguồn có 200 khai báo, chỉ mục identifiers giữ 128 tên đầu tiên theo thứ tự xuất hiện của khai báo (ưu tiên khai báo hơn tham chiếu), không còn cắt theo thứ tự bảng chữ cái; kết quả lưu vẫn sắp theo code-unit và không trùng.
- [x] `ac-2` (met): Thuộc tính C# (ví dụ public string PaymentRequestCode { get; set; }) và phương thức C# hoặc Java (ví dụ public async Task<Foo> GetFooAsync(int id)) có trong identifiers của file chứa chúng; constructor, từ khóa và tên kiểu trả về không bị lấy nhầm.
- [x] `ac-3` (met): Record JSON (bản ghi ra đĩa, thụt 2 dấu cách) của một file nguồn 100 KB có 500 khai báo không lớn hơn 12 KB (đo bằng test xác định), và trần số tên, độ dài tên lấy từ một hằng số dùng chung cho trích xuất và kiểm tra hợp lệ.
- [x] `ac-4` (met): Import PHP được nhận trong importTargets: use Ten\Lop; (dấu gạch chéo ngược đổi thành dấu chấm), require/include(_once) với chuỗi, và ->load->model|library|helper|view('X') của CodeIgniter.
- [x] `ac-5` (met): Chuỗi trong ->from('bang alias'), ->join('bang') hoặc SQL của PHP không còn thành importTargets; from 'x' của JavaScript, TypeScript và Python vẫn được nhận; import của Go và Java giữ nguyên kết quả hiện tại (test khóa hành vi).
- [x] `ac-6` (met): Record có thêm trường tùy chọn references (đã sắp, không trùng, tối đa 48 tên, mỗi tên tối đa 96 ký tự), chỉ gồm tên mà file này dùng và được khai báo ở từ 1 đến 4 file khác; tính ở bước làm mới sau khi trích xuất mọi file, không dùng lại record của lần trước.
- [x] `ac-7` (met): harnix repo-map --impact <file .cs> trả các file .cs thật tham chiếu tới kiểu khai báo trong file đó (fixture ABP) ở khoảng cách 1, xếp trước các .csproj; việc mở rộng theo ProjectReference của .csproj bao quanh được giữ nguyên (test impact hiện có vẫn xanh); tương tự cho PHP và TypeScript trong fixture.
- [x] `ac-8` (met): Cache có extractorVersion 1: các lệnh query, impact, tests và refs trả status invalid (không thêm giá trị status mới) kèm trường tùy chọn mới hint bằng run harnix repo-map --refresh, và việc đọc không ghi file nào.
- [x] `ac-9` (met): PRD, IMPLEMENTATION_PLAN (mục 4.12, 4.16 và mô tả cache), README, CHANGELOG được đồng bộ, cache repo-map được theo dõi trong git và test self-host được cập nhật theo extractorVersion 2, phiên bản nâng lên 2.31.0-dev.1 bằng pnpm version:sync, và pnpm run test:gates xanh.
- [x] `ac-10` (met): --refresh dựng lại bản extractorVersion 2 mà không dùng lại record cũ; doctor báo cache extractorVersion cũ là repo-map-stale (cảnh báo, sửa được) và cache không phải repo map vẫn là repo-map-invalid; doctor --fix đưa cache cũ về ready.
- [x] `ac-11` (met): Task đã lưu sidecar context trước khi nâng cấp không chuyển sang contextDrift stale chỉ vì cache còn extractorVersion 1: inventoryFingerprint được đọc từ cache cũ (chỉ phụ thuộc path và contentHash) thay vì rơi về rỗng.
- [x] `ac-12` (met): Cạnh từ references chịu trần riêng (tối đa 8 cạnh mỗi file và 50.000 cạnh tổng), ưu tiên cạnh import khi hết trần, và loại tên được khai báo ở 1 đến 4 file nhưng được hơn 200 file dùng; kết quả --query, --tests, --impact trên fixture TypeScript hiện có không đổi (test khóa).

## Required checks

- [x] `chk-focused` (focused): Test đơn vị và tích hợp của trích xuất và đồ thị repo-map — pass (2026-11-09 21:49:41 +07:00)
- [x] `chk-migration` (focused): Test migration cache extractorVersion cũ sang 2 — pass (2026-11-09 21:49:48 +07:00)
- [x] `chk-gates` (focused): Test hợp đồng CLI, tài liệu và kiến trúc — pass (2026-11-09 21:49:57 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án — pass (2026-11-09 21:51:30 +07:00)

## Decisions

- **dec-evidence-extractor** — Nâng extractorVersion lên 2 và coi nó là member chạy đầu tiên của epic.
  - _Why:_ Người dùng duyệt ngày 2026-11-09. Đo trên his (PHP, 2.046 file) và payment_hub (C#, 1.437 file): identifiers cắt 48 tên theo bảng chữ cái (generateAutoKeyM01ReceiptCode không có trong chỉ mục dù 15 file dùng); import PHP chỉ là tên bảng SQL từ ->from(); thuộc tính C# không được lập chỉ mục (PaymentRequestCode: 20 kết quả nhưng 1 file thật sự chứa, grep thấy 28; TenantReferenceCode: 0); using C# nối tới .csproj nên --impact Transaction.cs trả 11 .csproj trong khi 81 file .cs dùng nó.
- **dec-additive-fields** — Chỉ thêm trường tùy chọn vào RepoMapRecordV1 và giữ schemaVersion 1.
  - _Why:_ Giữ tương thích đọc; extractorVersion là tín hiệu làm mới, không phải đổi cấu trúc bắt buộc.
- **dec-select-then-sort** — Chọn tên giữ lại theo thứ tự ưu tiên và xuất hiện, rồi mới sắp theo code-unit khi lưu.
  - _Why:_ Cache yêu cầu mảng đã sắp và không trùng (store.ts); lỗi hiện tại là cắt 48 tên sau khi sắp theo bảng chữ cái nên tên bắt đầu bằng chữ thường ở file lớn bị mất.
- **dec-references-two-pass** — references được tính ở bước làm mới sau khi mọi file đã trích xuất, từ danh sách tên đã khai báo, và không dùng lại record của lần trước.
  - _Why:_ Tập tên khai báo toàn cục đổi khi file khác đổi, nên references của một file không đổi nội dung vẫn có thể đổi; trích xuất đã đọc mọi file để băm nên không tốn thêm I/O.
- **dec-invalid-for-old-cache** — Cache extractorVersion 1 dùng trạng thái invalid sẵn có kèm hint --refresh, không thêm giá trị status stale.
  - _Why:_ Giữ nguyên enum công khai (missing|invalid|ready|not-found) của query, impact, tests, refs; validateRepoMap vốn đã từ chối extractorVersion khác 1 nên readPreviousRecords trả rỗng và không dùng lại record cũ.
- **dec-assumption-csproj** — Nguyên nhân .csproj xuất hiện làm dependents của file .cs chưa xác định; chẩn đoán bằng fixture ở slice đồ thị trước khi sửa.
  - _Why:_ Đã xác minh importTargets của csproj là đường dẫn ProjectReference tương đối và của file .cs là namespace, nhưng chưa tái hiện cơ chế nối; sửa trong cùng task nếu nằm ở graph.ts, không đổi hợp đồng công khai.
- **dec-csproj-root-cause** — Nguyên nhân .csproj làm dependents của file .cs là impact.ts:41-52, không phải graph.ts; thay dec-assumption-csproj.
  - _Why:_ impact.ts cố ý mở rộng theo .csproj bao quanh và test impact hiện có khóa hành vi; giữ phần mở rộng này, thêm dependents mức file ở khoảng cách 1 xếp trước.
- **dec-hint-additive** — Thêm trường tùy chọn hint vào kết quả unavailable của query, impact, tests, refs.
  - _Why:_ Hiện chỉ nhánh --events có hint; thêm trường tùy chọn là thay đổi chỉ cộng thêm và có tiền lệ, cần ghi vào IMPLEMENTATION_PLAN mục 4.16.
- **dec-context-fingerprint** — context.ts đọc inventoryFingerprint bằng hàm không phụ thuộc extractorVersion.
  - _Why:_ Nếu không, cache v1 làm fingerprint rỗng và mọi task có sidecar context thành contextDrift stale sau nâng cấp, buộc replan theo AGENTS.
- **dec-tracked-cache** — Cache repo-map của chính repo này được tái sinh ở Slice 9 và test self-host đổi kỳ vọng thành 2.
  - _Why:_ File đang được git theo dõi (722 KB) và self-host.test.ts đọc nó; người dùng quyết định commit và chấp nhận cache lớn hơn.
- **dec-users-threshold** — Ngưỡng loại tên dùng quá rộng là 200 file, không phải 25.
  - _Why:_ Đo trên payment_hub: tên chung thường được khai báo ở hơn 4 file nên đã bị loại bởi giới hạn nơi khai báo; ngưỡng 25 chủ yếu loại nhầm kiểu trung tâm. Với 200: Transaction trong references của 71 trên 81 file dùng, cache 1,42 MB thành 2,13 MB (x1,50), RSS đỉnh 143 MB.
- **dec-doctor-stale** — Cache extractorVersion cũ là repo-map-stale (warning) trong doctor, không phải repo-map-invalid.
  - _Why:_ doctor.ts chỉ gọi fixProjectState khi project.status là ready; finding mức error làm status invalid nên --fix không bao giờ dựng lại cache invalid. Query, impact, tests, refs vẫn trả status invalid kèm hint (enum công khai không đổi).

## Residual risks

- **risk-cache-size** (medium) — Trần symbol cao hơn và trường references làm cache lớn hơn; giảm thiểu bằng trần có giới hạn và đo trên his và payment_hub.
- **risk-regex-limits** (low) — Trích xuất vẫn bằng regex nên tham chiếu động (reflection, DI theo chuỗi) vẫn bị bỏ sót; kết quả là gợi ý điều hướng.
- **risk-doctor-invalid-unfixable** (low) — Cache hỏng thật (không phải repo map) vẫn là repo-map-invalid mức error nên doctor --fix bỏ qua và không dựng lại; lỗi có sẵn từ trước task, ngoài phạm vi; người dùng chạy harnix repo-map --refresh.
- **risk-doctor-extra-scan** (low) — diagnoseRepoMap dùng extractRepoMapRecord nên vẫn tính tập usedNames rồi bỏ đi; chỉ tốn CPU thêm khi chạy doctor, không đổi kết quả.

## Evidence

- skipped (2026-11-09 21:00:09 +07:00): Task contract revised at persisted replan: Sửa theo review độc lập ngày 2026-11-09 đã kiểm chứng với mã: impact.ts:41-52 cố ý mở rộng .csproj; hint chỉ có ở nhánh events; context.ts rơi về fingerprint rỗng khi cache cũ; thiếu trần cạnh references.
- skipped (2026-11-09 21:00:09 +07:00): Task contract revised at persisted replan: Sửa theo review độc lập ngày 2026-11-09 đã kiểm chứng với mã: impact.ts:41-52 cố ý mở rộng .csproj; hint chỉ có ở nhánh events; context.ts rơi về fingerprint rỗng khi cache cũ; thiếu trần cạnh references.
- skipped (2026-11-09 21:00:10 +07:00): Task contract revised at persisted replan: Sửa theo review độc lập ngày 2026-11-09 đã kiểm chứng với mã: impact.ts:41-52 cố ý mở rộng .csproj; hint chỉ có ở nhánh events; context.ts rơi về fingerprint rỗng khi cache cũ; thiếu trần cạnh references.
- skipped (2026-11-09 21:00:10 +07:00): Task contract revised at persisted replan: Sửa theo review độc lập ngày 2026-11-09 đã kiểm chứng với mã: impact.ts:41-52 cố ý mở rộng .csproj; hint chỉ có ở nhánh events; context.ts rơi về fingerprint rỗng khi cache cũ; thiếu trần cạnh references.
- skipped (2026-11-09 21:00:12 +07:00): Task contract revised at persisted replan: Sửa theo review độc lập ngày 2026-11-09 đã kiểm chứng với mã: impact.ts:41-52 cố ý mở rộng .csproj; hint chỉ có ở nhánh events; context.ts rơi về fingerprint rỗng khi cache cũ; thiếu trần cạnh references.
- skipped (2026-11-09 21:01:11 +07:00): Task contract revised at persisted replan: Sửa theo review độc lập ngày 2026-11-09 đã kiểm chứng với mã: impact.ts:41-52 cố ý mở rộng .csproj; hint chỉ có ở nhánh events; context.ts rơi về fingerprint rỗng khi cache cũ; thiếu trần cạnh references.
- skipped (2026-11-09 21:01:12 +07:00): Task contract revised at persisted replan: Sửa theo review độc lập ngày 2026-11-09 đã kiểm chứng với mã: impact.ts:41-52 cố ý mở rộng .csproj; hint chỉ có ở nhánh events; context.ts rơi về fingerprint rỗng khi cache cũ; thiếu trần cạnh references.
- skipped (2026-11-09 21:01:12 +07:00): Task contract revised at persisted replan: Sửa theo review độc lập ngày 2026-11-09 đã kiểm chứng với mã: impact.ts:41-52 cố ý mở rộng .csproj; hint chỉ có ở nhánh events; context.ts rơi về fingerprint rỗng khi cache cũ; thiếu trần cạnh references.
- skipped (2026-11-09 21:01:13 +07:00): Task contract revised at persisted replan: Sửa theo review độc lập ngày 2026-11-09 đã kiểm chứng với mã: impact.ts:41-52 cố ý mở rộng .csproj; hint chỉ có ở nhánh events; context.ts rơi về fingerprint rỗng khi cache cũ; thiếu trần cạnh references.
- skipped (2026-11-09 21:01:14 +07:00): Task contract revised at persisted replan: Sửa theo review độc lập ngày 2026-11-09 đã kiểm chứng với mã: impact.ts:41-52 cố ý mở rộng .csproj; hint chỉ có ở nhánh events; context.ts rơi về fingerprint rỗng khi cache cũ; thiếu trần cạnh references.
- skipped (2026-11-09 21:37:31 +07:00): Task contract revised at persisted replan: Đo thực tế trên payment_hub ngày 2026-11-09: ngưỡng 25 file dùng loại cả kiểu trung tâm (Transaction có 0 file trong references dù 81 file .cs dùng); với 200 thì 71 file có, --impact Transaction.cs trả 16 file .cs thay vì 7, cache x1,50 so với bản cũ.
- `chk-suite` — pass (2026-11-09 21:51:30 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-focused` — pass (2026-11-09 21:49:41 +07:00): pnpm exec vitest run repo-map — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-migration` — pass (2026-11-09 21:49:48 +07:00): pnpm test:migration — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-11-09 21:49:57 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- skipped (2026-11-09 21:48:10 +07:00): Task contract revised at persisted replan: Kiểm chứng thực tế: doctor --fix chỉ chạy khi trạng thái dự án là ready, nhưng repo-map-invalid là error nên cache extractorVersion cũ không bao giờ được --fix dựng lại; chuyển sang repo-map-stale (warning) như khuyến nghị của review.
