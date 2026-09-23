# PRD: Hỗ trợ database hạng nhất trong catalog và siết guide/skill/scan từ nghiên cứu ak-quick-setup

## Bối cảnh

Một lượt nghiên cứu read-only trên bộ `docs/ak-quick-setup` (108 skill `ak-*`, 17 agent, 8 file steering) đã lọc ra đúng những phần vừa lấp khoảng trống thật của Harnix vừa nằm trong ranh giới sản phẩm. Tuyệt đại đa số bị loại: 43 skill phụ thuộc MCP/CLI ngoài, khoảng 35 skill trùng vai trò với 7 skill `harnix-*`, khoảng 25 skill ngoài catalog stack. Phần còn lại là bốn nhóm nội dung cụ thể cộng một khoảng trống coverage.

**Phát hiện nghiêm trọng nhất, đã kiểm chứng bằng thực nghiệm:** `scripts/scan-release.mjs` chỉ có một pattern secret duy nhất dựa trên từ khoá (`api_key|password|secret|token` theo sau bởi giá trị). Chạy thử với 8 mẫu cho kết quả 7/8 lọt: khoá AWS, GitHub PAT, Stripe live key, khoá Anthropic, header private key, JWT, và connection string chứa credential đều không bị bắt. Chỉ dạng `api_key = "..."` bị bắt. Đây là lỗ hổng trong chính cổng release của Harnix.

**Khoảng trống coverage:** Harnix có 7 language guide và 7 technology guide nhưng không có guide nào cho database, dù ABP/.NET, Spring, NestJS và CodeIgniter đều là stack nặng database.

## Mục tiêu và giá trị người dùng

Sau thay đổi này, `pnpm run scan:release` chặn được mọi định dạng secret có cấu trúc phổ biến trước khi một tarball rời máy. Agent chạy `harnix-check` biết rõ những gì **không** được flag, nên report review ít nhiễu hơn và không lặp lại các finding đã được giải quyết ngay trong diff. Guide chung dạy agent quản lý tiến trình nền để không để lại process mồ côi chiếm cổng, và không nhúng ID kế hoạch vào code. Và một dự án dùng PostgreSQL, MySQL, SQL Server, MongoDB hoặc Redis sẽ được `harnix init` nhận diện, rồi nhận đúng guide database tương ứng trong `.harnix/spec/guides/`.

## Quyết định phạm vi đã chốt

1. **Năm database vào catalog** (người dùng chọn khi được hỏi): `postgresql`, `mysql`, `sqlserver`, `mongodb`, `redis`. `TechnologyKind` đã có sẵn giá trị `"database"` nên enum này không đổi; chỉ union `TechnologyId` mở rộng.
2. **Detector dùng `dependency` (npm/composer) cộng `content` glob.** Lý do bắt buộc: `src/utils/detection.ts` chỉ thu thập dependency của npm và composer — `nuget`, `maven`, `gradle` có trong type `DetectorEcosystem` nhưng không bao giờ được collect. Đây chính là lý do Spring và ABP đang dùng `content` glob trên `pom.xml`/`*.csproj`. Không mở rộng detection engine trong task này.
3. **Guide database viết theo thể loại prose nguyên lý của Harnix**, không phải công thức CLI. Một guide nền dùng chung cho nhóm quan hệ, các guide vendor tham chiếu qua trường `extends` đã có sẵn trong `GuideDescriptor`.
4. **Guide và skill không được chứa chuỗi ví dụ mang hình dạng secret.** Ràng buộc này là hệ quả trực tiếp của mục tiêu 1: nội dung guide được bundle vào `dist/`, mà `scan:release` quét toàn bộ tarball. Một dòng ví dụ connection string mang credential trong guide sẽ tự làm hỏng cổng release.

## Trong phạm vi

- Bảng pattern secret có cấu trúc trong `scripts/scan-release.mjs`, tách nhóm high-confidence và medium-confidence, cộng test hồi quy.
- Danh sách suppression và taxonomy lỗi cụ thể trong `src/skills/harnix-check/SKILL.md`.
- Ba nhóm nội dung mới trong `src/guides/common/engineering.md`: quản lý tiến trình nền/cổng, cấm nhúng ID kế hoạch vào code artifact, và kinh tế tool-call (batch, đọc một lần, không mang dump output đi tiếp). Mở rộng danh sách unhappy-path hiện có thêm các chiều authorization, data integrity, integration/contract drift, error cascade.
- Năm technology database trong `src/catalog/catalog.ts`, đồng bộ đủ bốn điểm khai báo ID: `src/catalog/validation.ts`, `src/catalog/types.ts`, `src/core/config/config.ts`, `src/templates/harnix/agents.ts`.
- Kiểm chứng end-to-end rằng `harnix init` tự nhận diện database và ghi vào `.harnix/config.yaml` mà không cần cờ ghi đè, với mọi detector database đạt ít nhất `probable` để qua được bộ lọc của `selectedTechnologies`.
- Sáu file guide mới dưới `src/guides/technologies/database/` và wiring trong `src/guides/catalog.ts`.
- Cập nhật `docs/IMPLEMENTATION_PLAN.md` §4 và §4.1A cùng `docs/HARNIX_PRD.md` trong cùng lần thay đổi, theo đúng mục "Frozen contracts" của AGENTS.md.
- Tăng patch version đúng một lần và cập nhật `CHANGELOG.md`.

## Ngoài phạm vi

- Không mở rộng `src/utils/detection.ts` để thu thập dependency nuget/maven/gradle. Đó là thay đổi riêng, có giá trị độc lập, và `content` glob đã đủ cho task này.
- Không nhập bất kỳ skill `ak-*` hay agent nào dưới dạng file. Chỉ nội dung được chắt lọc vào guide/skill sẵn có.
- Không nhập nội dung reference gắn version của AK cho language/technology guide hiện có. Harnix guide là prose nguyên lý; nội dung gắn API cụ thể sẽ mục và Harnix không có cơ chế bảo trì nó.
- Không adopt `defense-in-depth.md` của AK. Nó dạy validate lặp ở bốn lớp, mâu thuẫn trực tiếp với nguyên tắc parse-once-at-the-boundary đang có trong `engineering.md`.
- Không đụng `docs/ak-quick-setup/` (đang untracked, thuộc sở hữu người dùng).
- Không gộp Redis vào guide nền quan hệ; Redis nhận guide riêng vì hướng dẫn của nó là TTL/eviction/invalidation, khác thể loại datastore bền vững.

## Tiêu chí chấp nhận

### AC `release-scan-detects-structured-secrets`

`scanTextFiles` trong `scripts/scan-release.mjs` ném lỗi khi gặp bất kỳ định dạng secret có cấu trúc nào trong nhóm high-confidence: khoá AWS, GitHub token (classic và fine-grained), Stripe live/restricted key, Slack token, Google API key, khoá Anthropic, header private key, JWT ba phần, và connection string database chứa credential. Đồng thời `pnpm run scan:release` tiếp tục pass trên tarball và fixture hiện tại, chứng minh không có false positive trên nội dung hợp lệ đang được đóng gói.

### AC `check-skill-defines-review-noise-bounds`

`src/skills/harnix-check/SKILL.md` chứa một danh sách tường minh những loại finding **không** được báo cáo (ít nhất: dư thừa giúp dễ đọc, yêu cầu thêm comment giải thích ngưỡng, thay đổi chỉ nhằm nhất quán, no-op vô hại, vấn đề style thuộc về linter, và bất kỳ điều gì đã được xử lý ngay trong diff đang review), cộng một taxonomy mẫu lỗi cụ thể cho Stage 2 gồm ít nhất: find-or-create thiếu unique constraint, status transition thiếu điều kiện atomic, so sánh token không dùng constant-time, output của LLM ghi vào lưu trữ hoặc truy vấn mà không validate, và N+1 trong vòng lặp. Nội dung này trả về nguyên vẹn qua `harnix skill harnix-check`.

### AC `common-guide-adds-process-and-artifact-discipline`

`src/guides/common/engineering.md` chứa hướng dẫn quản lý tiến trình nền (theo dõi tiến trình đã khởi động, tái dùng hoặc dừng thay vì đổi cổng khi cổng bận, dừng khi task/session kết thúc, chỉ dừng tiến trình mình sở hữu), quy tắc không nhúng ID kế hoạch/số phase/ID tiêu chí/ID check vào comment, tên test, tên migration hay commit message, và quy tắc kinh tế tool-call. Danh sách unhappy-path hiện có được mở rộng thêm các chiều authorization, data integrity, integration/contract drift và error cascade.

### AC `catalog-supports-five-databases`

`stackCatalog.technologies` chứa đúng năm descriptor mới với `kind: "database"` và ID `mongodb`, `mysql`, `postgresql`, `redis`, `sqlserver`. Mỗi descriptor có ít nhất một detector `confirmed` hợp lệ theo `validateStackCatalog`, và detection trên fixture repo nhận diện đúng từng database qua đường dependency npm hoặc qua `content` glob cho `*.csproj`/`pom.xml`/`build.gradle`. Không descriptor nào dùng detector `dependency` với ecosystem `nuget`, `maven` hoặc `gradle`.

### AC `database-guides-selected-by-stack`

Mỗi database có một file guide dưới `src/guides/technologies/database/`, cộng một guide nền dùng chung cho nhóm quan hệ được các guide quan hệ tham chiếu qua `extends`. `selectGuideSources` trả về đúng guide vendor kèm guide nền khi stack chứa database tương ứng, và không trả về guide database nào khi stack không chứa database. `seedRules` ghi các file đó vào đúng đường dẫn dưới `.harnix/spec/guides/`. Không file guide nào chứa chuỗi khớp pattern secret mới.

### AC `technology-id-sync-complete`

Cả **bốn** điểm đồng bộ cùng liệt kê đủ năm ID mới: union `TechnologyId` trong `src/catalog/types.ts`, tập `technologyIds` trong `src/catalog/validation.ts` (chạy lúc module load bên trong `validateStackCatalog`), tập `technologyIds` trong `src/core/config/config.ts`, và bản ghi `technologyLabels` trong `src/templates/harnix/agents.ts`. `parseInitProfile` chấp nhận từng ID mới qua cờ `--technologies` và từ chối ID không hợp lệ. `pnpm run typecheck` và `pnpm run lint` đều xanh.

### AC `init-detects-databases-end-to-end`

`initializeProject` tự nhận diện database mà **không** cần cờ `--technologies`: trên fixture repo có `package.json` khai báo `pg` hoặc `mongodb`, và trên fixture có `*.csproj` chứa `Npgsql` hoặc `pom.xml` chứa driver PostgreSQL, file `.harnix/config.yaml` được ghi ra chứa đúng technology ID database tương ứng, và `detection.matches` chứa match với `facet: "technology"` cùng `kind: "database"`. Vì `selectedTechnologies` loại bỏ match có confidence `weak`, mọi detector database phải đạt `confirmed` hoặc `probable` mới được auto-select.

### AC `frozen-contract-docs-updated-same-change`

`docs/IMPLEMENTATION_PLAN.md` §4 cập nhật khai báo `TechnologyId` và §4.1A cập nhật danh sách technology kind ban đầu để phản ánh năm database mới; `docs/HARNIX_PRD.md` mô tả hỗ trợ database ở mức sản phẩm. Cả hai nằm trong cùng lần thay đổi với code, không để lại tài liệu lệch.

### AC `release-artifacts-prepared`

`package.json` tăng patch version đúng một lần và `CHANGELOG.md` có một mục duy nhất mô tả các thay đổi hướng người dùng. `pnpm run build`, `pnpm run scan:release` và `pnpm run test:acceptance` đều pass với evidence tươi.
