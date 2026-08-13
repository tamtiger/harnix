# PRD: Catalog stack và guide dựa trên bằng chứng

## Prerequisite: refactor workflow skill

Bảy skill hiện được rút gọn thành các string ba đoạn trong `src/templates/harnix/workflow.ts`. Cách này che source khỏi maintainer, lặp renderer giữa ba platform và đã làm mất guardrail quan trọng: `harnix-brainstorm` có thể đánh dấu `ready` dù contract material chưa đóng băng. Trước stack/catalog runtime, Harnix phải khôi phục workflow skill thành source thật có test.

Source canonical:

```text
src/skills/
  harnix-brainstorm/SKILL.md
  harnix-implement/SKILL.md
  harnix-check/SKILL.md
  harnix-finish-work/SKILL.md
  harnix-continue/SKILL.md
  harnix-research/SKILL.md
  harnix-debug/SKILL.md
```

Build import các file Markdown dưới dạng text và nhúng vào ESM bundle; runtime không đọc source tree hay network. Catalog parse/validate frontmatter `name` và `description`, giữ content/body canonical, từ chối duplicate/malformed/missing skill. Kiro, Antigravity và Codex ghi cùng byte content cho mỗi `SKILL.md`; activation guard nằm trong source canonical, không được prepend bằng ba renderer khác nhau.

Mapping behavior:

| Harnix skill | Nguồn đã khóa | Behavior giữ lại |
|---|---|---|
| `harnix-brainstorm` | Trellis brainstorm/workflow; Superpowers brainstorming + writing-plans | evidence trước câu hỏi, scope decomposition, decision inventory, acceptance observable, no-placeholder/self-review, ready gate fail-closed |
| `harnix-implement` | Trellis before-dev; Superpowers executing-plans + TDD + receiving-review | critical plan review trước code, load context tối thiểu, RED fail đúng lý do, GREEN tối thiểu, refactor khi green, feedback được verify kỹ thuật |
| `harnix-debug` | Superpowers systematic-debugging; ECC agent-introspection-debugging | capture symptom, root-cause investigation, một hypothesis phân biệt được, contained recovery, regression; sau ba hypothesis thất bại phải replan architecture |
| `harnix-check` | Trellis check; Superpowers verification-before-completion + request/receive review | compliance trước quality/security, claim → command, fresh output/exit code, severity và technical validation, không blind-fix feedback |
| `harnix-finish-work` | Trellis finish; Superpowers verification/finishing | reread state/diff, gate evidence, persist completed an toàn; loại branch/commit/push/PR menu |
| `harnix-continue` | Trellis continue/workflow | route theo persisted status/checkpoint/artifact, không suy diễn approval/state, fail closed khi corrupt/future |
| `harnix-research` | Trellis research; ECC deep-research | một material unknown, source authority/recency, fact tách inference, artifact có conclusion/uncertainty; không ép MCP/subagent/network |

Không port universal hard gate, bắt buộc user approval lần hai, worktree, subagent, commit, branch, merge, push hoặc PR. Harnix vẫn cho phép implementation ngay khi request ban đầu đã authorize và ready gate thực sự pass. Không thêm `agents/openai.yaml` trong slice này vì public contract hiện chỉ cài `SKILL.md` trên cả ba platform; thêm metadata platform-specific cần quyết định surface riêng.

Chi tiết provenance và quyết định adaptation nằm tại `research/workflow-skill-refactor.md`.

## Vấn đề

Harnix hiện lưu language, framework, runtime và platform trong cùng một enum `LanguageId`. Các giá trị ghép như `csharp-dotnet-abp`, `typescript-nestjs`, `java-spring` và `react-web` dễ khẳng định quá mức khả năng của repository, đồng thời làm khó việc mở rộng kho specification/guide. Chỉ tách `languages` và `frameworks` sẽ sửa tên gọi hiện tại nhưng sớm bế tắc với .NET, database, library, build tool, infrastructure và domain guidance.

## Quyết định sau research

Giữ language nguồn là một facet thực tế riêng; mọi thứ còn lại đi qua catalog technology có kiểu. Descriptor của technology sở hữu `kind`; config project chỉ lưu ID ổn định. Catalog detection trả lời repository đang dùng gì, còn catalog guide quyết định nội dung ngắn hay sâu nào phù hợp.

Các pattern tham khảo, không sao chép runtime code hoặc content:

- GitHub Linguist tách phân loại language và loại trừ generated, vendored, documentation, binary cùng override path.
- ECC cho thấy cách map khai báo từ stack sang rules/skills và init có bằng chứng, nhưng registry phẳng hiện tại vẫn trộn language, framework, ecosystem và có thể nhận Laravel từ marker Composer chung.
- Vercel và Netlify mô tả framework bằng detector khai báo: package, path, content, exclusion, conjunction và precedence.
- GitHub Awesome Copilot và các bộ Cursor rules gắn description, path glob, activation và category cho guidance tái sử dụng.

Bản ghi nguồn đầy đủ và phần chưa chắc chắn nằm tại `research/stack-and-guide-catalog.md`.

## Kết quả mong muốn

Config v2 biểu diễn language và technology độc lập ở project/package. Catalog được validate điều khiển detection có giới hạn và giải thích được. Catalog guide chọn guidance common, language và technology theo profile, path và task, thay vì tạo một file khổng lồ cho mỗi stack ID.

## Taxonomy mục tiêu

```ts
type LanguageId =
  | "csharp"
  | "typescript"
  | "javascript"
  | "php"
  | "python"
  | "java"
  | "go";

type TechnologyKind =
  | "framework"
  | "runtime"
  | "platform"
  | "library"
  | "database"
  | "tool"
  | "infrastructure"
  | "domain";

type TechnologyId =
  | "dotnet"
  | "abp"
  | "nestjs"
  | "spring"
  | "react-web"
  | "vue"
  | "codeigniter";
```

Union `TechnologyId` ban đầu giữ phạm vi hiện có và thêm CodeIgniter. Catalog có thể thêm database, tool và kind khác ở các slice content sau mà không phải đổi schema config lần nữa. Mỗi ID mới vẫn phải qua source change được review; config project không nhận ID tùy ý.

## Contract catalog

```ts
type Confidence = "confirmed" | "probable" | "weak";
type GuideId = string;

interface Provenance {
  source: string;
  license: string;
  adaptedAt: string; // YYYY-MM-DD
}

type DetectorPredicate =
  | { kind: "file"; glob: string }
  | {
      kind: "dependency";
      ecosystem: "npm" | "composer" | "nuget" | "maven" | "gradle";
      name: string;
    }
  | { kind: "content"; glob: string; contains: string };

interface LanguageDescriptor {
  id: LanguageId;
  label: string;
  detectors: DetectorExpression[];
  guideIds: GuideId[];
  provenance: Provenance;
}

interface TechnologyDescriptor {
  id: TechnologyId;
  kind: TechnologyKind;
  label: string;
  detectors: DetectorExpression[];
  implies?: { languages?: LanguageId[]; technologies?: TechnologyId[] };
  supersedes?: TechnologyId[];
  guideIds: GuideId[];
  provenance: Provenance;
}

interface DetectorExpression {
  confidence: Confidence;
  allOf?: DetectorPredicate[];
  anyOf?: DetectorPredicate[];
  noneOf?: DetectorPredicate[];
}

interface GuideDescriptor {
  id: GuideId;
  title: string;
  description: string;
  category: "rule" | "guide" | "skill";
  appliesTo: {
    languages?: LanguageId[];
    technologies?: TechnologyId[];
    paths?: string[];
    topics?: string[];
  };
  activation: "always" | "path" | "task";
  priority: number;
  contentPath: string;
  extends?: GuideId[];
  supersedes?: GuideId[];
  provenance: Provenance;
}

interface DetectionEvidence {
  kind: DetectorPredicate["kind"];
  path: string; // repository-relative POSIX path only
  detail: string; // bounded identifier/marker, never file content or secret value
}

interface DetectionMatch {
  id: LanguageId | TechnologyId;
  facet: "language" | "technology";
  kind: "language" | TechnologyKind;
  confidence: Confidence;
  evidence: DetectionEvidence[];
  source: "catalog";
}
```

`file.glob` và `content.glob` chỉ dùng POSIX-relative literals, `*` và `**`; không chấp nhận absolute path, drive prefix, backslash, `.`/`..`, NUL, brace/extglob hoặc character class. `content.contains` là literal bounded, không phải regex. Dependency collector chỉ đọc manifest ecosystem đã biết với byte/depth/count limit; không chạy package manager hoặc code project.

Mỗi expression phải có ít nhất một predicate dương trong `allOf` hoặc `anyOf`. Khi cả hai có mặt, mọi `allOf` và ít nhất một `anyOf` phải match; không `noneOf` nào được match. Mảng có mặt phải không rỗng và không chứa predicate trùng. Match của nhiều expression cho cùng ID giữ confidence mạnh nhất và hợp nhất evidence theo thứ tự ổn định. Thứ tự confidence là `confirmed > probable > weak`.

Validator nhận toàn bộ language, technology và guide catalog làm input thuần; từ chối ID trùng, enum/confidence/provenance thiếu hoặc sai, reference `implies`/`guideIds`/`extends`/`supersedes` thiếu, self-reference, cycle, supersedence xung đột, unsafe glob/content path, duplicate predicate và `contentPath` không an toàn hoặc trùng. Catalog module không import filesystem collector, command, UI hoặc platform configurator. Source guide được import thành text ở build time và test hai chiều với descriptor qua `contentPath`; runtime không duyệt source tree.

Kind ban đầu được khóa như sau:

| Technology | Kind | Quan hệ |
|---|---|---|
| `dotnet` | `runtime` | không tự suy ra C# nếu chỉ có `global.json`/solution metadata |
| `abp` | `framework` | implies `dotnet`; language được detector nguồn xác lập riêng |
| `nestjs` | `framework` | không tự suy ra TypeScript nếu repository không có evidence TypeScript |
| `spring` | `framework` | không tự suy ra Java nếu repository không có evidence Java |
| `react-web` | `library` | loại React Native bằng negative evidence; language xác lập riêng |
| `vue` | `framework` | language xác lập riêng |
| `codeigniter` | `framework` | language PHP xác lập riêng |

Không dùng `supersedes` để xóa runtime/framework bổ sung hợp lệ như `abp` + `dotnet`; quan hệ này chỉ giải quyết hai technology cạnh tranh cho cùng vai trò khi catalog tương lai có case cụ thể.

## Mapping migration v1

| Config v1 ID | Config v2 languages | Config v2 technologies |
|---|---|---|
| `csharp-dotnet-abp` | `csharp` | `dotnet`, `abp` |
| `typescript-nestjs` | `typescript` | `nestjs` |
| `php` | `php` | không có |
| `python` | `python` | không có |
| `java-spring` | `java` | `spring` |
| `go` | `go` | không có |
| `react-web` | không có | `react-web` |
| `vue` | không có | `vue` |

Migration chỉ chuyển nghĩa đã lưu; không quét lại hay đoán JavaScript/TypeScript cho React/Vue lịch sử. Unknown key tương thích được giữ nguyên. Schema lỗi hoặc schema tương lai phải bị từ chối trước khi ghi.

## Hành vi detection

Detection trả `DetectionMatch[]` trước khi normalize thành ID config. Evidence được dedupe và sort theo `path`, `kind`, `detail`; mỗi match và toàn bộ result có giới hạn số item/ký tự. Collector bỏ symlink thay vì follow và không trả absolute path.

- Composer chung hoặc source PHP chỉ nhận PHP; `codeigniter/framework` hay marker canonical có giới hạn mới nhận CodeIgniter. Composer một mình không có nghĩa Laravel hoặc CodeIgniter.
- `.csproj` hoặc source `.cs` nhận C#; `.csproj`, `global.json` hoặc solution metadata có giới hạn nhận .NET; chỉ dependency/reference ABP mới thêm ABP. `.sln`/`global.json` một mình không khẳng định C#.
- Source `.java` nhận Java; Maven/Gradle chỉ là ecosystem/build evidence; dependency/plugin Spring mới thêm Spring. Build file chung một mình không khẳng định Java hoặc Spring.
- Dependency NestJS nhận NestJS; `tsconfig.json`/source TypeScript mới nhận TypeScript. NestJS một mình không khẳng định source language.
- Dependency React/Vue nhận technology; evidence source/`tsconfig` chọn TypeScript hoặc JavaScript độc lập, không suy language từ framework dependency.
- Path generated, vendored, dependency, cache, documentation-only, binary và symlink escape bị bỏ qua.
- `confirmed` cần dependency manifest hoặc match config/content có thẩm quyền; `probable` dùng marker canonical; `weak` dùng extension fallback. Chỉ evidence confirmed/probable tự chọn technology guide. Evidence weak được báo để xác nhận và có thể đóng góp cho language.
- `supersedes` ưu tiên technology cụ thể hơn mà không làm mất evidence.

Confidence tier và ngưỡng tự chọn là suy luận thiết kế của Harnix từ các pattern research, không phải contract tương thích của upstream.

## Thư viện guide và cách chọn

```text
src/guides/
  catalog.ts
  common/<topic>.md
  languages/<language>/<topic>.md
  technologies/<kind>/<technology>/<topic>.md
```

Managed output được chọn sẽ phản chiếu hierarchy đó dưới `.harnix/spec/guides/`. Package có thể chứa nhiều descriptor nhưng Harnix chỉ materialize và load nội dung phù hợp.

Thứ tự chọn là common, language, rồi technology/domain ngày càng cụ thể. Cùng layer dùng priority rồi ID để sắp xếp ổn định. Nội dung project/user đã sửa có quyền cao hơn và được giữ nguyên. `rule` ngắn có thể luôn active, `guide` theo path chỉ active với file khớp, `skill` sâu chỉ active theo task. Một technology có thể chọn nhiều guide nhỏ; một guide có thể áp dụng cho nhiều technology.

Guide được adapt phải ghi URL upstream, license, ngày adapt và ownership của Harnix. Text nhập từ ngoài cần review license/attribution, cập nhật upstream baseline/mapping và release scan. Repository dùng để discovery không mặc nhiên là nguồn content đáng tin.

## CLI và output

- `harnix init` giữ `--languages <csv>` và thêm `--technologies <csv>`.
- `InitProjectResult` thêm `technologies` đã sort và `detection: { matches: DetectionMatch[] }`. Với project đã init, `detection.matches` rỗng vì lệnh không rescan; với project mới/dry-run, field phản ánh detection trước override. Override quyết định config nhưng không sửa evidence; warning nêu facet nào đã override. Không lưu evidence vào config v2.
- Compound value legacy truyền qua `--languages` là alias chuyển tiếp, normalize kèm warning và không bao giờ được ghi thành ID config v2.
- Config v1 hiện hữu không bị mutate trong `init`; `update` hoặc `doctor --fix` mới migration rõ ràng.
- Root `AGENTS.md` render riêng dòng `Languages:` và `Technologies:`.
- Context matching xem hai facet là một stack bonus có giới hạn và chỉ chọn metadata/content guide phù hợp.

## Tương thích và an toàn

- Read không có side effect. Migration explicit, giữ permission, atomic và idempotent.
- Config v1 vẫn đọc được trong giai đoạn chuyển tiếp; config v2 là format duy nhất được ghi mới.
- Compatible unknown keys được giữ ở top level và trong từng package/context/runtime object. Known field luôn được validate/serialize theo v2; unknown key không được phép shadow hoặc thay đổi nghĩa field known.
- Guide đã sửa hoặc không thuộc Harnix được giữ và báo cáo; chỉ file cũ nguyên bản do Harnix quản lý mới được xóa.
- Test không chạm user profile thật, không network, không package command và không chạy code project.
- PHP detection chưa commit của người dùng được giữ và trở thành baseline evidence PHP chung.

## Quyết định để sau

- Batch content mở rộng đầu tiên cần ưu tiên riêng theo project mục tiêu; ứng viên là database và framework phổ biến của PHP/Python/JavaScript.
- Trước khi adapt text ngoài, phải freeze commit upstream và kiểm tra license. Research này chỉ dùng ý tưởng kiến trúc.
- Catalog extension do user tự viết chưa thuộc refactor này; v2 dùng catalog packaged đã validate.
