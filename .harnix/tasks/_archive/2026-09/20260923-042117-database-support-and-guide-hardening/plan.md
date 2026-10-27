# Plan: Hỗ trợ database hạng nhất và siết guide/skill/scan

## Checklist triển khai

- [x] `S1` — Test RED cho pattern secret có cấu trúc trong `test/safety/release-scanner.test.ts`
- [x] `S2` — Thêm bảng pattern high/medium-confidence vào `scripts/scan-release.mjs` (GREEN cho S1)
- [x] `S3` — Test RED cho nội dung suppression và taxonomy của `harnix-check`
- [x] `S4` — Viết suppression list và taxonomy vào `src/skills/harnix-check/SKILL.md` (GREEN cho S3)
- [x] `S5` — Test RED cho ba nhóm nội dung mới của `engineering.md`
- [x] `S6` — Viết nội dung process/artifact/tool-call và mở rộng unhappy-path (GREEN cho S5)
- [x] `S7` — Test RED cho năm database trong catalog, detection, và nhận diện end-to-end lúc `harnix init`
- [x] `S8` — Thêm năm `TechnologyId`, descriptor, và đồng bộ đủ bốn điểm sync (GREEN cho S7)
- [x] `S9` — Test RED cho chọn guide database theo stack
- [x] `S10` — Viết sáu file guide database và wiring `extends` (GREEN cho S9)
- [x] `S11` — Đồng bộ `docs/IMPLEMENTATION_PLAN.md` §4 và §4.1A cùng `docs/HARNIX_PRD.md`
- [x] `S12` — Bump patch version, viết `CHANGELOG.md`, chạy cổng kiểm chứng rộng

<!-- harnix:execution-notes:begin -->
slice:S1=passed
slice:S2=passed
check:chk-secret-scan=passed@2026-09-23T04:41:17Z
slice:S3=passed
slice:S4=passed
check:chk-skill-content=passed@2026-09-23T04:43:56Z
slice:S5=passed
slice:S6=passed
check:chk-guide-content=passed@2026-09-23T04:46:38Z
slice:S7=passed
slice:S8=passed
slice:S9=passed
slice:S10=passed
check:chk-catalog-detection=passed@2026-09-23T05:01:28Z
check:chk-init-detection=passed@2026-09-23T05:01:28Z
check:chk-guide-selection=passed@2026-09-23T05:01:28Z
check:chk-static-analysis=passed@2026-09-23T05:01:28Z
slice:S11=passed
check:chk-docs-parity=passed@2026-09-23T05:04:01Z
check:chk-release-gate=passed@2026-09-23T06:40:08Z
slice:S12=passed
<!-- harnix:execution-notes:end -->

## Thứ tự và phụ thuộc

S1–S2 phải xong trước S10. Lý do: pattern secret mới quét toàn bộ tarball, mà guide database nằm trong `dist/`. Biết chính xác pattern nào đang bật là điều kiện để viết guide không tự làm hỏng cổng release. S7–S8 phải xong trước S9–S10 vì `selectGuideSources` cần `TechnologyId` tồn tại. S11 sau S8 để tài liệu phản ánh đúng union cuối cùng. S12 chạy sau cùng.

## Chi tiết từng slice

### Slice `S1`

Thêm test vào `test/safety/release-scanner.test.ts` gọi `scanTextFiles` (đã export từ `scripts/scan-release.mjs`) trên một file tạm chứa lần lượt từng mẫu secret có cấu trúc, assert mỗi lần đều reject. Dựng mẫu bằng cách ghép chuỗi tại runtime chứ không viết literal nguyên vẹn trong file test, để chính file test không khớp pattern khi nó bị quét ở nơi khác. Thêm một case đối chứng khẳng định nội dung vô hại không bị reject. Chạy `pnpm exec vitest run test/safety/release-scanner.test.ts` xác nhận RED trước khi sửa S2.

Criteria: `release-scan-detects-structured-secrets`
Checks: `chk-secret-scan`
Paths: `test/safety/release-scanner.test.ts`

### Slice `S2`

Trong `scripts/scan-release.mjs`, bổ sung cạnh `potentialSecretPattern` hiện có một mảng pattern có cấu trúc, tách nhóm high-confidence (AWS, GitHub classic và fine-grained, Stripe live/restricted, Slack, Google API key, Anthropic, header private key, JWT ba phần) và nhóm medium-confidence (connection string database mang credential). Giữ nguyên `potentialSecretPattern` cũ; `containsPotentialSecret` trả true khi bất kỳ pattern nào khớp, vẫn tôn trọng nhánh xử lý `.map` sẵn có. Mọi regex dùng cờ không dính trạng thái hoặc reset `lastIndex` trước mỗi lần dùng để tránh lỗi `g` giữ vị trí. Chạy lại test S1 xác nhận GREEN, rồi chạy `pnpm run scan:release` để chứng minh không false positive trên tarball hiện tại.

Criteria: `release-scan-detects-structured-secrets`
Checks: `chk-secret-scan`
Paths: `scripts/scan-release.mjs`

### Slice `S3`

Thêm test vào `test/workflow/skill-sources.test.ts` khẳng định nội dung canonical của `harnix-check` chứa mục suppression với các mục cấm đã nêu trong tiêu chí, và taxonomy mẫu lỗi cụ thể. Kiểm tra qua nguồn skill mà lệnh `harnix skill` phục vụ, không đọc trực tiếp file, để test bảo vệ đúng thứ người dùng nhận được. Chạy xác nhận RED.

Criteria: `check-skill-defines-review-noise-bounds`
Checks: `chk-skill-content`
Paths: `test/workflow/skill-sources.test.ts`

### Slice `S4`

Thêm vào `src/skills/harnix-check/SKILL.md` hai mục: một danh sách những loại finding không được báo cáo, đặt ngay sau "Convergence rule" vì đó là nơi đang nói về ngưỡng chặn; và một danh sách mẫu lỗi cụ thể bổ sung cho Stage 2, giữ nguyên các phạm trù trừu tượng hiện có và thêm mẫu cụ thể bên dưới. Không đổi bất kỳ quy tắc evidence, freshness hay transport nào. Cập nhật mục "Upstream basis" ghi nhận nguồn. Chạy lại test S3 xác nhận GREEN.

Criteria: `check-skill-defines-review-noise-bounds`
Checks: `chk-skill-content`
Paths: `src/skills/harnix-check/SKILL.md`

### Slice `S5`

Thêm test vào `test/unit/rules.test.ts` khẳng định `commonRules` chứa hướng dẫn tiến trình nền, quy tắc cấm nhúng ID kế hoạch vào code artifact, quy tắc kinh tế tool-call, và các chiều unhappy-path mở rộng. Chạy xác nhận RED.

Criteria: `common-guide-adds-process-and-artifact-discipline`
Checks: `chk-guide-content`
Paths: `test/unit/rules.test.ts`

### Slice `S6`

Sửa `src/guides/common/engineering.md`: thêm một mục về tiến trình nền và tài nguyên; thêm các gạch đầu dòng về artifact ổn định vào mục "Deliver with evidence"; thêm các gạch đầu dòng kinh tế tool-call; mở rộng dòng unhappy-path hiện có trong mục "Test the behavior that matters" bằng các chiều bổ sung. Giữ nguyên thể loại prose nguyên lý và giữ mức tăng độ dài có kiểm soát vì đây là guide `always` nạp cho mọi dự án. Chạy lại test S5 xác nhận GREEN.

Criteria: `common-guide-adds-process-and-artifact-discipline`
Checks: `chk-guide-content`
Paths: `src/guides/common/engineering.md`

### Slice `S7`

Thêm test vào `test/unit/catalog.test.ts` khẳng định năm descriptor database tồn tại với `kind: "database"` và qua được `validateStackCatalog`; thêm test vào `test/unit/detection.test.ts` dựng fixture repo cho từng đường nhận diện: `package.json` có `pg`/`mysql2`/`mongodb`/`ioredis`, một `*.csproj` chứa `Npgsql` và một chứa `Microsoft.Data.SqlClient`, một `pom.xml` chứa driver PostgreSQL. Khẳng định thêm rằng không descriptor nào khai báo detector `dependency` với ecosystem nuget/maven/gradle, và không detector database nào chỉ đạt `weak` — vì `selectedTechnologies` lọc bỏ `weak` nên detector yếu sẽ không bao giờ được auto-select.

Thêm test vào `test/integration/init.test.ts` chạy `initializeProject` trên fixture repo **không** truyền cờ `--technologies`, khẳng định `.harnix/config.yaml` ghi ra chứa đúng technology ID database và `detection.matches` có match với `facet: "technology"` cùng `kind: "database"`. Chạy xác nhận RED cả ba nhóm test.

Criteria: `catalog-supports-five-databases`, `init-detects-databases-end-to-end`
Checks: `chk-catalog-detection`, `chk-init-detection`
Paths: `test/integration/init.test.ts`, `test/unit/catalog.test.ts`, `test/unit/detection.test.ts`

### Slice `S8`

Mở rộng union `TechnologyId` trong `src/catalog/types.ts` thêm `mongodb`, `mysql`, `postgresql`, `redis`, `sqlserver`. Thêm năm descriptor vào `stackCatalog.technologies` trong `src/catalog/catalog.ts` với `kind: "database"`, mỗi descriptor có ít nhất một detector `confirmed` hoặc `probable`, theo quyết định phạm vi: dependency npm cho đường Node, `content` glob trên `**/*.csproj`, `**/pom.xml`, `**/build.gradle`, `**/build.gradle.kts` cho đường .NET và Java, dependency composer nơi có gói thật.

Đồng bộ **cả bốn** điểm, theo đúng thứ tự rủi ro:

1. `src/catalog/validation.ts` — tập `technologyIds` ở dòng 13. Đây là điểm nguy hiểm nhất vì `validateStackCatalog` chạy ngay lúc module load của `src/catalog/catalog.ts`; bỏ sót thì chính catalog không import nổi và mọi test đều đỏ theo cách khó đọc.
2. `src/catalog/types.ts` — union `TechnologyId`.
3. `src/core/config/config.ts` — tập `technologyIds` ở dòng 66, dùng để validate config đọc từ đĩa.
4. `src/templates/harnix/agents.ts` — bản ghi `technologyLabels`; TypeScript ép exhaustive nên thiếu sót lộ ra ở typecheck.

Không cần sửa `src/commands/init.ts`: nó suy ra `technologyIds` từ `stackCatalog` ở dòng 42 nên tự nhận ID mới. Cũng không có prompt tương tác liệt kê technology — chỉ có cờ `--technologies`. Chạy lại test S7 xác nhận GREEN cả ba nhóm, cộng `pnpm run typecheck`.

Criteria: `catalog-supports-five-databases`, `init-detects-databases-end-to-end`, `technology-id-sync-complete`
Checks: `chk-catalog-detection`, `chk-init-detection`, `chk-static-analysis`
Paths: `src/catalog/catalog.ts`, `src/catalog/types.ts`, `src/catalog/validation.ts`, `src/core/config/config.ts`, `src/templates/harnix/agents.ts`

### Slice `S9`

Thêm test vào `test/unit/rules.test.ts` khẳng định `composeRules`/`selectGuideSources` trả về guide vendor kèm guide nền quan hệ khi stack chứa database quan hệ, chỉ trả guide vendor khi stack chứa MongoDB hoặc Redis, và không trả guide database nào khi stack rỗng database; khẳng định `seedRules` ghi đúng đường dẫn. Thêm một assert quét toàn bộ nội dung guide bảo đảm không chuỗi nào khớp pattern secret mới. Chạy xác nhận RED.

Criteria: `database-guides-selected-by-stack`
Checks: `chk-guide-selection`
Paths: `test/unit/rules.test.ts`

### Slice `S10`

Tạo `src/guides/technologies/database/relational/engineering.md` làm guide nền cho nhóm quan hệ (transaction và isolation, index như một contract, migration tương thích ngược, connection pooling, truy vấn có giới hạn và thứ tự xác định, tham số hoá). Tạo năm guide vendor dưới `src/guides/technologies/database/` cho postgresql, mysql, sqlserver, mongodb, redis, chỉ chứa điều đặc thù của từng hệ. Wiring trong `src/guides/catalog.ts`: import sáu nội dung, thêm sáu mục `guide(...)`, ba guide quan hệ khai báo `extends` trỏ về guide nền. Tuyệt đối không viết chuỗi ví dụ mang hình dạng secret hay connection string trong bất kỳ guide nào. Chạy lại test S9 xác nhận GREEN.

Criteria: `database-guides-selected-by-stack`
Checks: `chk-guide-selection`
Paths: `src/guides/catalog.ts`, `src/guides/technologies/database`

### Slice `S11`

Cập nhật `docs/IMPLEMENTATION_PLAN.md`: khai báo `TechnologyId` trong §4 và danh sách technology kind ban đầu trong §4.1A. Cập nhật `docs/HARNIX_PRD.md` mô tả hỗ trợ database ở mức sản phẩm. Đọc kỹ văn bản xung quanh trước khi sửa để không phá vỡ câu chữ contract khác.

Criteria: `frozen-contract-docs-updated-same-change`
Checks: `chk-docs-parity`
Paths: `docs/HARNIX_PRD.md`, `docs/IMPLEMENTATION_PLAN.md`

### Slice `S12`

Tăng patch version trong `package.json` đúng một lần, chạy script đồng bộ version nếu repo có, viết một mục `CHANGELOG.md` mô tả các thay đổi hướng người dùng kèm ghi chú rằng config có ID database mới sẽ bị bản Harnix cũ từ chối. Chạy `pnpm run build`, `pnpm run scan:release`, `pnpm run test:acceptance` và đọc đầy đủ exit code cùng output.

Criteria: `release-artifacts-prepared`
Checks: `chk-release-gate`
Paths: `CHANGELOG.md`, `package.json`
