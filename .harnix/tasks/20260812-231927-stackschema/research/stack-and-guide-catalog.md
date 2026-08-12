# Research: kiến trúc detection stack và thư viện guide

- Task: `20260812-231927-stackschema`
- Ngày: 2026-08-12
- Unknown cần giải quyết: Mô hình tách nghiêm ngặt `languages`/`frameworks` có bền vững không, và repository nào có pattern tốt cho detection stack cùng thư viện spec/guide mở rộng?
- Phạm vi: chỉ research và planning. Không copy runtime code hoặc guide content từ upstream.

## Nguồn và quan sát

### Everything Claude Code (ECC)

- Repository và catalog hiện tại: <https://github.com/affaan-m/ECC>, <https://github.com/affaan-m/ECC/blob/main/config/project-stack-mappings.json>
- Khởi tạo project: <https://github.com/affaan-m/ECC/blob/main/commands/project-init.md>
- Tổ chức rules: <https://github.com/affaan-m/ECC/blob/main/rules/README.md>
- Nhóm đóng góp: <https://github.com/affaan-m/ECC/blob/main/CONTRIBUTING.md>

ECC hiện detect stack từ manifest, framework file, package dependency và mapping khai báo tùy chọn; sau đó đề xuất rules/skills tối thiểu kèm evidence. Lớp common dùng chung, lớp ecosystem chuyên biệt và mapping stack → rules/skills là các pattern hữu ích.

ECC chưa giải quyết sạch taxonomy Harnix cần. Registry phẳng trộn language (`typescript`, `python`), framework (`react`, `nextjs`), ecosystem (`csharp-dotnet`) và profile ghép (`php-laravel`). Indicator `composer.json` chung cho `php-laravel` có thể nhận nhầm Laravel. Vì vậy Harnix chỉ mượn mapping khai báo và evidence output, không mượn ID hoặc ngưỡng detection của ECC.

### GitHub Linguist

- Repository: <https://github.com/github-linguist/linguist>
- Override và phân loại generated/vendored: <https://github.com/github-linguist/linguist/blob/main/docs/overrides.md>
- Hành vi language của GitHub: <https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-repository-languages>

Linguist xem phân loại language là bài toán riêng dựa trên filename, extension, heuristic và override tường minh, đồng thời loại generated, vendored, documentation và binary. Điều này ủng hộ việc giữ `languages` độc lập thay vì ép mọi fact thành một stack list. Harnix chỉ lấy nguyên tắc phân tách/exclusion, không thêm runtime Ruby/native của Linguist.

### Vercel framework registry

- Registry: <https://github.com/vercel/vercel/blob/main/packages/frameworks/src/frameworks.ts>

Descriptor framework của Vercel kết hợp detector package, path và content bằng `some`/`every`, đồng thời có quan hệ `supersedes`. Đây là pattern tốt cho evidence dương/bắt buộc và ưu tiên framework cụ thể trước ancestor chung.

### Netlify framework-info

- Repository: <https://github.com/netlify/framework-info>

Registry độc lập đã archive của Netlify dùng một descriptor cho mỗi framework, gồm category, npm dependency, excluded dependency và config file; đồng thời cho phép nhiều framework match. Repository đã chuyển vào Netlify Build nên chỉ là reference kiến trúc. Negative evidence đặc biệt hữu ích để tránh collision React web/React Native.

### GitHub Awesome Copilot

- Repository và catalog: <https://github.com/github/awesome-copilot>, <https://github.com/github/awesome-copilot/blob/main/docs/README.instructions.md>
- Contract đóng góp: <https://github.com/github/awesome-copilot/blob/main/AGENTS.md>
- License: <https://github.com/github/awesome-copilot/blob/main/LICENSE>
- Hành vi instruction theo path: <https://docs.github.com/en/copilot/tutorials/customization-library/custom-instructions/your-first-custom-instructions>

Awesome Copilot tách instructions, agents và skills, yêu cầu metadata tái sử dụng như description và `applyTo` glob. Catalog máy đọc được và validation phù hợp với mục tiêu mở rộng library mà không load mọi document. Content do cộng đồng đóng góp nên phải review; MIT không loại bỏ yêu cầu provenance và adaptation riêng cho từng item.

### Awesome Cursor Rules

- Repository: <https://github.com/PatrickJS/awesome-cursorrules>

Cursor rules dùng frontmatter như description, globs và always-on activation, đồng thời phân loại rộng hơn language/framework. Catalog CC0 hữu ích để tìm metadata convention và content gap, nhưng chất lượng cộng đồng không đồng đều nên không phù hợp để ingest nguyên khối.

### Fallow

- Repository: <https://github.com/fallow-rs/fallow>

Fallow báo fact về stack/workspace/package-manager/test-runner bằng recommendation tier và rationale, để lựa chọn chủ quan hiển thị cho user. Phạm vi thiên về JavaScript/TypeScript, nhưng mô hình giải thích được phù hợp với việc Harnix trả evidence và confidence thay vì ID mờ.

## Quyết định

Đề xuất hai mảng ban đầu đúng hướng nhưng quá hẹp. Chọn:

1. `languages`: ID ngôn ngữ nguồn, first-class.
2. `technologies`: ID ổn định; `kind` trong catalog có thể là framework, runtime, platform, library, database, tool, infrastructure hoặc domain.
3. Detection catalog riêng: predicate khai báo có giới hạn, `allOf`/`anyOf`/`noneOf`, implication, supersedence, confidence và evidence repository-relative.
4. Guide catalog riêng: category, description, áp dụng theo language/technology/path/topic, activation, priority, composition và provenance.
5. Selection phân lớp: common → language → technology/domain cụ thể hơn; guidance project đã sửa vẫn có quyền cao nhất.
6. Ba tầng content: rule ngắn luôn active, guide theo path và skill sâu theo task. Không materialize hoặc inject cả thư viện.

Evidence chung chỉ xác lập fact chung: Composer suy ra PHP, Maven/Gradle suy ra Java, `.csproj` suy ra C# cùng .NET. Guide framework cụ thể cần dependency/config/content có thẩm quyền. Điều này ngăn overclaim ABP/Spring hiện tại và điểm yếu Composer/Laravel của ECC.

Confidence `confirmed`, `probable`, `weak` cùng quy tắc chỉ tự chọn guide với confirmed/probable là suy luận thiết kế Harnix từ evidence model đã research, không phải contract upstream.

## Phần còn chưa chắc chắn

- Trước khi adapt text phải freeze commit upstream và kiểm tra license; branch được xem trong research có thể thay đổi.
- Chọn batch content mở rộng đầu tiên từ repository mục tiêu thực tế. Database và framework phổ biến PHP/Python/JavaScript là ứng viên, chưa phải phạm vi đã cam kết.
- Sau khi tách guide Harnix hiện có, phải đo package footprint và context budget; catalog lớn không được làm tăng footprint project đáng kể.
- Catalog extension do user viết cần thiết kế trust, validation và ownership riêng, tạm hoãn khỏi config v2.

## Trả lại cho planning

Đã sửa PRD và implementation plan từ `languages`/`frameworks` sang `languages`/`technologies`, thêm detection catalog và guide catalog riêng, giữ migration v1 explicit và giới hạn ID technology ban đầu. Task sẵn sàng triển khai theo contract mới.
