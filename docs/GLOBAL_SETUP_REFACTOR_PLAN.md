# Kế hoạch refactor Harnix setup sang user-global

## 1. Trạng thái và quyết định sản phẩm

Tài liệu này là kế hoạch triển khai và decision record cho Phase 6, lập ngày **2026-08-11** từ yêu cầu mới và tài liệu chính thức hiện hành của Kiro, Antigravity và Codex. G0–G9 cùng toàn bộ automated isolated-home acceptance đã hoàn tất với fresh evidence trong current working tree. Manual smoke trong tool session thật của disposable profile/test home chưa chạy vì chưa có explicit authorization; nó vẫn là acceptance ngoài fixture và không được thay bằng claim activation thực tế.

Quyết định đích:

- `harnix init` tiếp tục khởi tạo state của từng project trong `.harnix/`.
- `harnix setup --kiro --antigravity --codex` cài integration ở **user scope**, chạy được từ bất kỳ thư mục nào và không yêu cầu project hiện tại có `.harnix/config.yaml`.
- Skill, instruction/rule và hook global chỉ kích hoạt workflow sau khi guard resolve project initialized gần nhất từ cwd hoặc workspace roots, kể cả ancestor của cwd; không chỉ kiểm tra thư mục workspace hiện tại. Nếu không tìm thấy `.harnix/config.yaml` của project đó, chúng phải no-op nhanh, không chặn prompt và không tạo state.
- Runtime vẫn nằm trong package npm đã cài. Setup chỉ materialize customization files; không copy runtime script, credential, MCP config hoặc permission policy.
- Mọi file global được quản lý bằng ownership manifest riêng theo platform root. Không dùng manifest của một project để sở hữu file dùng chung và không tạo `~/.harnix`.

“Global” trong tài liệu này nghĩa là mọi workspace/conversation của đúng Kiro, Antigravity hoặc Codex trên cùng user profile. Nó không làm Microsoft VS Code thông thường tự đọc `.kiro` hay `.gemini`.

## 2. Kết quả research chính thức

### 2.1 Ma trận path và cơ chế load

| Platform surface | Skills | Instruction/rule | Hooks | Ghi chú |
|---|---|---|---|---|
| Kiro IDE/CLI | `~/.kiro/skills/harnix-*/SKILL.md` | `~/.kiro/steering/harnix.md` | `~/.kiro/hooks/harnix-context.json` | User và workspace scopes được merge; workspace skill cùng tên ưu tiên. Hook dùng JSON v1 và trigger `UserPromptSubmit`. |
| Antigravity Desktop/IDE | `~/.gemini/config/plugins/harnix/skills/harnix-*/SKILL.md` | `~/.gemini/config/plugins/harnix/rules/harnix.md` | `~/.gemini/config/plugins/harnix/hooks.json` | Plugin global được auto-discover cho mọi workspace; `plugin.json` là bắt buộc. |
| Antigravity CLI (`agy`) | `~/.gemini/antigravity-cli/plugins/harnix/skills/harnix-*/SKILL.md` | `~/.gemini/antigravity-cli/plugins/harnix/rules/harnix.md` | `~/.gemini/antigravity-cli/plugins/harnix/hooks.json` | CLI dùng vùng staging riêng; không giả định plugin Desktop tự được CLI load. |
| Codex CLI/IDE | `$HOME/.agents/skills/harnix-*/SKILL.md` | `$CODEX_HOME/AGENTS.md`, mặc định `~/.codex/AGENTS.md` | `$CODEX_HOME/hooks.json`, mặc định `~/.codex/hooks.json` | Skill user-global **không nằm trong `.codex/skills`**. Global và repo hook sources được merge. |

Nguồn xác minh:

- Codex: [skill locations](https://learn.chatgpt.com/docs/build-skills), [hooks](https://learn.chatgpt.com/docs/hooks), [global AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
- Kiro: [configuration scopes](https://kiro.dev/docs/configuration/), [skills](https://kiro.dev/docs/skills/), [steering](https://kiro.dev/docs/steering/), [hooks](https://kiro.dev/docs/hooks/), [hook actions](https://kiro.dev/docs/hooks/actions/).
- Antigravity: [skills](https://antigravity.google/docs/skills), [IDE plugins](https://antigravity.google/docs/ide/plugins), [hooks](https://antigravity.google/docs/hooks), [CLI plugins](https://antigravity.google/docs/cli/features), [CLI migration](https://antigravity.google/docs/gcli-migration).

Version snapshot tại thời điểm research:

- Kiro global IDE hook có từ IDE `1.0.182`. CLI global hook xuất hiện trong V3 early-access của `2.13.0`, còn current standalone JSON format là CLI 3.0 contract. Đây là baseline cho manual hoặc external authoritative capability evidence; regular CLI không chạy unverified version probe và không suy capability chỉ từ file tồn tại. Xem [Kiro IDE 1.0.182](https://kiro.dev/changelog/ide/1-0-182/) và [Kiro CLI 2.13.0](https://kiro.dev/changelog/cli/2-13/).
- Antigravity docs hiện hiển thị Desktop/2.0 `2.6.0`, IDE `2.1.1`, CLI `1.1.11`.
- Codex dùng current official schema tại ngày research; schema fixture phải được revalidate trước release. Version/activation status chỉ được report khi có external authoritative evidence, không phải automatic probe của regular CLI.

### 2.2 Các contract cũ phải bị supersede

- Kiro `.kiro/hooks/harnix-context.kiro.hook` với `promptSubmit -> runCommand` là project-local schema cũ; target mới là user-global JSON v1 `UserPromptSubmit`.
- Antigravity `.gemini/skills` và root `GEMINI.md` là project surface cũ. Target mới là hai namespaced plugin global riêng cho Desktop và CLI.
- Codex project `.agents/skills`, `.codex/hooks.json` và custom `[harnix]` trong `.codex/config.toml` không còn là output của `setup`. Global skill đi vào `$HOME/.agents/skills`, còn hook dùng nested current schema trong `$CODEX_HOME/hooks.json`.
- `config.platforms` trong `.harnix/config.yaml` không còn là nguồn ownership/install state. Giữ field này để đọc config v1 backward-compatible, nhưng deprecate và ignore cho global setup.

## 3. Khoảng cách của code hiện tại

Đây là thay đổi kiến trúc, không thể chỉ thay `root` bằng `os.homedir()`:

1. `src/cli.ts` và `src/commands/setup.ts` luôn resolve project root và đọc `.harnix/config.yaml`.
2. `update`, `doctor` và `uninstall` dùng `.harnix/.template-hashes.json` để sở hữu cả project data lẫn platform files.
3. Các configurator render path project-local và một số hook schema đã lỗi thời.
4. Hai project khác nhau có thể cùng ghi/xóa một file global nếu tiếp tục dùng project manifest.
5. Test hiện chỉ có temporary repository; đổi path trực tiếp có nguy cơ chạm `%USERPROFILE%` thật.
6. Atomic replacement chưa có contract bảo toàn permission mode của shared global config.
7. `harnix internal context` xử lý một `cwd`; Antigravity cung cấp `workspacePaths[]` và có thể là multi-folder Project.

## 4. Kiến trúc đích

```text
CLI commands
├── ProjectLifecycle
│   ├── init/update/mem/project doctor
│   └── root: <repo>/.harnix
└── UserIntegrationLifecycle
    ├── setup/global update/global doctor/global uninstall
    ├── HomeResolver + PlatformRootResolver
    ├── GlobalOwnershipStore + FileLock
    └── Kiro / Antigravity / Codex adapters

platform adapters -> templates/skills/rules
lifecycle commands -> managed-file + atomic-write primitives
core workflow -X-> platform paths, Commander, Inquirer
```

Các boundary mới:

- `HomeResolver` dùng `os.homedir()` ở production và bắt buộc inject fake home trong test.
- `CodexRootResolver` tôn trọng `CODEX_HOME` cho `.codex` surfaces; `$HOME/.agents/skills` vẫn là root riêng theo official contract.
- Kiro mặc định dùng `<home>/.kiro`. `KIRO_HOME` chỉ được dùng nếu capability/version detection chứng minh IDE và CLI hiện tại cùng đọc nó; nếu không doctor cảnh báo thay vì ghi hai nơi mơ hồ.
- Antigravity dùng `<home>/.gemini`, sau đó tách Desktop plugin và CLI plugin roots.
- `resolveSafeUserPath` chỉ nhận root đã xác minh và relative POSIX path, từ chối filesystem root, traversal, symlink/junction escape và path nằm ngoài root.
- Không persist hoặc in absolute home path. JSON/human output dùng logical path như `~/.kiro/...`, `$CODEX_HOME/...`.
- Project discovery của hook đi ngược từ cwd để tìm **nearest** `.harnix/config.yaml`, kể cả non-Git workspace. Git root chỉ là một boundary signal; symlink-equivalent roots phải realpath-dedupe trước khi chọn.

## 5. Global ownership contract

Không tạo một `~/.harnix` global. Mỗi target root có sidecar Harnix riêng, ví dụ:

```text
~/.kiro/harnix/managed.json
~/.gemini/config/plugins/harnix/.managed.json
~/.gemini/antigravity-cli/plugins/harnix/.managed.json
~/.codex/harnix/managed.json
~/.agents/harnix/managed.json
```

Vị trí sidecar phải có fixture chứng minh platform bỏ qua trước khi khóa snapshot. Mỗi manifest chỉ chứa path tương đối với chính root của nó:

```ts
interface GlobalManagedManifestV1 {
  generator: "harnix";
  schemaVersion: 1;
  platform: "kiro" | "antigravity-desktop" | "antigravity-cli" | "codex";
  entries: Array<{
    path: string;
    sourceId: string;
    kind: "file" | "managed-block" | "json-member";
    selector?:
      | { type: "markers"; begin: string; end: string }
      | { type: "json-array-member"; pointer: string; memberId: string };
    generatedHash: string;
    generatorVersion: string;
  }>;
}
```

Ownership rules:

- Create khi target chưa tồn tại.
- Target mang tên Harnix nhưng đã tồn tại trước manifest là `untracked-collision`: preserve, không overwrite và không tự baseline thành Harnix-owned.
- Update chỉ khi content hiện tại trùng `generatedHash` cũ.
- `selector` bắt buộc cho fragment kinds và bị cấm với whole-file kind; manifest validation từ chối selector overlap hoặc JSON pointer không canonical.
- Với `file`, `generatedHash` là hash toàn file. Với `managed-block` hoặc `json-member`, hash chỉ bao phủ canonical Harnix-owned fragment được `selector` định danh, không bao phủ unrelated user content. Một path có thể có nhiều entries chỉ khi selector không overlap và có unique `sourceId`/`memberId`.
- Shared JSON array member được nhận diện bằng stable `memberId` cộng exact structural signature, không bằng array index. User sửa unrelated event/handler không ngăn update fragment Harnix; sửa fragment Harnix chuyển state sang `modified` và được preserve.
- Preserve và warning khi user đã sửa, marker không cân bằng hoặc shared JSON không hợp lệ.
- Uninstall chỉ xóa unchanged Harnix entries/subtrees; không xóa platform root hay unrelated keys.
- Manifest corrupt/future version làm lệnh fail trước write.
- Manifest được ghi cuối transaction. Multi-platform setup preflight toàn bộ, acquire lock theo thứ tự ổn định, snapshot affected state và rollback các write đã áp dụng nếu một bước thất bại. Rollback chỉ restore snapshot khi disk hash vẫn bằng exact output Harnix vừa ghi; nếu editor/tool khác đã sửa đồng thời, preserve content mới và report `partial-rollback`.
- Atomic replacement phải giữ permission mode hiện tại của file, đặc biệt với global config có thể chứa dữ liệu nhạy cảm.
- Lock file có schema gồm generator/version, owner PID, process start time, acquired time và operation ID; có bounded wait, stale-owner detection/reclaim và crash-recovery tests. Harnix lock không được giả định khóa được editor/platform process.

## 6. Contract CLI mới

### 6.1 Setup

```text
harnix setup --kiro|--antigravity|--codex [nhiều flag]
             [--dry-run]
```

- User-global là behavior duy nhất; không thêm `--scope project`.
- Không gọi `resolveProjectRoot`, không đọc/ghi `.harnix/config.yaml` và không phụ thuộc detected languages.
- Platform flag là explicit authorization cho global mutation. `--dry-run` trả exact logical targets và planned states mà không write.
- Chỉ resolve/validate root của platform flag được chọn; root/config lỗi của platform không được chọn (ví dụ `CODEX_HOME` khi chỉ chọn Kiro) không được chặn lifecycle đó.
- Rerun là idempotent reconcile/update cho platform đã chọn.
- Setup kiểm tra constant `harnix` hook command có resolve trong inherited environment qua injected process runner. Khi chạy bằng `node dist/cli.js` hoặc project-local package mà launcher global không có trên PATH, file có thể được cài nhưng result phải là `binary-unavailable` kèm hướng dẫn actionable, không claim ready.
- Setup không chạy platform-version/capability probe. Các enum `active`, `shadowed` và `unsupported-version` chỉ dùng khi lifecycle boundary nhận external authoritative evidence; standalone CLI không suy chúng từ file hoặc launcher. Không có evidence, status giữ conservative (`installed`, `installed-pending-trust`, `binary-unavailable` hoặc `precedence-unknown`).
- Result phải hiển thị per-file status thay vì chỉ `configured`:

```ts
interface GlobalSetupResult {
  scope: "user";
  platforms: Array<{
    platform: "kiro" | "antigravity" | "codex";
    readiness: "installed" | "installed-pending-trust" | "binary-unavailable" | "shadowed" | "precedence-unknown" | "unsupported-version" | "drifted";
    created: string[];
    updated: string[];
    unchanged: string[];
    preserved: string[];
    warnings: string[];
  }>;
}
```

### 6.2 Update, doctor và uninstall

- `harnix update` giữ project-only semantics cho `.harnix/**`.
- `harnix update --global [platform flags]` reconcile global installation; nếu không có platform flag thì dùng các platform có manifest hợp lệ.
- `harnix doctor` trong Harnix project trả hai section: `project` và `globalIntegrations`. Ngoài Harnix project, nó vẫn trả được `globalIntegrations` thay vì ENOENT.
- `harnix doctor --fix --global` mới được sửa safe global drift; `--fix` project không tự mutate user home.
- `harnix uninstall --global --kiro|--antigravity|--codex [--yes]` preview rồi chỉ gỡ selected global integration. Thiếu `--yes` trả confirmation-required và không write.
- `harnix uninstall --purge --yes` chỉ xóa project `.harnix`; tuyệt đối không suy diễn thành xóa global setup.
- `harnix uninstall --legacy-project-surfaces [--yes]` preview rồi chỉ xóa unchanged **standalone** path legacy khi project manifest v1 chứng minh đúng source/path Harnix sở hữu. Root/shared file là inventory-only. Flag này mutually exclusive với `--global` và `--purge`; không thêm public command thứ tám.

Legacy cleanup result dùng stable shape `{ scope: "legacy-project-surfaces", targets, removed, preserved, confirmationRequired }`. Không có `--yes` thì chỉ populate `targets`, không write và trả confirmation-required exit semantics hiện hành.

### 6.3 Doctor JSON v2 và exit code

Phase 6 nâng doctor report từ flat schema v1 lên v2; consumer v1 phải nhận explicit schema mismatch thay vì đọc nhầm shape:

```ts
interface DoctorReportV2 {
  generator: "harnix";
  schemaVersion: 2;
  ok: boolean;
  project: {
    status: "ready" | "not-initialized" | "invalid";
    findings: DoctorFinding[];
  };
  globalIntegrations: Array<{
    platform: "kiro" | "antigravity" | "codex";
    status:
      | "not-installed"
      | "installed"
      | "active"
      | "installed-pending-trust"
      | "binary-unavailable"
      | "shadowed"
      | "precedence-unknown"
      | "unsupported-version"
      | "drifted"
      | "invalid";
    findings: DoctorFinding[];
  }>;
  summary: { errors: number; warnings: number; fixed: number };
}
```

- Exit `0`: global state được đọc an toàn và không có warning/error; `project:not-initialized` chỉ là info khi chạy ngoài project.
- Exit `1`: actionable warning như pending trust, binary unavailable, shadowed/unknown precedence, unsupported version hoặc drift.
- Exit `2`: usage sai, unsafe path, corrupt/future project hoặc global manifest/schema.
- `--fix` không bao giờ trust Codex hook, bật feature/permission hay sửa modified user fragment. `--fix --global` chỉ reconcile safe unchanged/missing global entries.

Schema giữ các enum `active`, `shadowed` và `unsupported-version` để nhận external authoritative version/precedence/activation evidence. Regular `harnix doctor` không execute platform-version command và không infer activation hoặc precedence từ managed files; khi evidence vắng mặt, report phải giữ conservative status thay vì claim active.

## 7. Adapter contract theo platform

### 7.1 Kiro

- Render global skills không phụ thuộc ngôn ngữ của project đang đứng lúc setup.
- `~/.kiro/steering/harnix.md` là bootstrap conditional: chỉ hướng dẫn đọc `.harnix/workflow.md` khi `.harnix/config.yaml` tồn tại.
- Hook dedicated file dùng schema hiện hành:

```json
{
  "version": "v1",
  "hooks": [
    {
      "name": "harnix-context",
      "trigger": "UserPromptSubmit",
      "action": {
        "type": "command",
        "command": "harnix internal context --platform kiro"
      },
      "timeout": 5,
      "enabled": true
    }
  ]
}
```

- Command chạy từ project root. Repo không có `.harnix` phải exit `0`, stdout rỗng. Không sửa `~/.kiro/settings/permissions.yaml`, MCP hoặc trusted commands.
- Doctor inventory Harnix workspace hook cũ có thể chạy trùng. `unsupported-version` chỉ được report khi có external authoritative Kiro capability evidence; regular CLI không tự probe version.

### 7.2 Antigravity

- Cài cùng một namespaced Harnix plugin vào cả Desktop và CLI roots; hai bản dùng cùng renderer nhưng manifest/ownership độc lập.
- `plugin.json` chỉ khai báo field được official schema chấp nhận; không sinh MCP hoặc settings.
- `hooks.json` có Harnix-owned `PreInvocation` command handler cố định:

```json
{
  "harnix-context": {
    "PreInvocation": [
      {
        "type": "command",
        "command": "harnix internal context --platform antigravity",
        "timeout": 5
      }
    ]
  }
}
```

- Handler chỉ inject ở invocation đầu và phải trả JSON đúng schema:

```json
{
  "injectSteps": [
    { "ephemeralMessage": "<bounded Harnix context>" }
  ]
}
```

- Với initialized project đã xác định nhưng invocation không còn là lượt đầu hoặc không có context, trả `{ "injectSteps": [] }`. Với workspace non-Harnix hoặc optional event malformed, exit `0` và stdout rỗng; không trả JSON empty và không trả plain text như adapter cũ.
- Chọn workspace root theo thứ tự: valid `cwd` nằm trong initialized root; nếu không có thì dùng root duy nhất trong `workspacePaths[]`; nếu có nhiều initialized roots mà không xác định được active root, không đọc project data và inject một warning ngắn về ambiguity.
- Doctor chỉ báo `active` hoặc `shadowed` khi external authoritative evidence xác minh activation/precedence; nếu plugin-vs-workspace precedence không có evidence thì báo `precedence-unknown`. File tồn tại không đủ để claim active, và regular CLI không probe version. Workspace precedence được revalidate từ [Antigravity hooks](https://antigravity.google/docs/hooks) và current product release notes trước khi khóa fixture.

### 7.3 Codex

- Skills cài vào `$HOME/.agents/skills/harnix-*`; đây là official user scope.
- Merge một managed conditional block vào `$CODEX_HOME/AGENTS.md`, giữ toàn bộ text ngoài marker. Nếu `AGENTS.override.md` làm block bị shadow, doctor cảnh báo.
- Không tạo hoặc sửa `[harnix]` trong `config.toml`; setup không cần đổi model, sandbox, approval, provider, auth, MCP hay feature flags.
- Merge current nested handler vào `$CODEX_HOME/hooks.json`, giữ unrelated events/groups/handlers:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "harnix internal context --platform codex",
            "timeout": 5,
            "additionalContextLimit": 2500
          }
        ]
      }
    ]
  }
}
```

- Không dùng `harnix.exe` hardcoded. Trước khi freeze Windows snapshot, smoke test phải chứng minh command cố định resolve được pnpm/npm `.cmd` shim từ Codex hook environment; nếu cần `commandWindows`, giá trị vẫn là constant không chứa absolute path.
- Hook sources được merge bởi Codex, nên doctor phát hiện project-local Harnix hook cũ và đề xuất explicit cleanup để tránh inject hai lần.
- Codex yêu cầu review/trust exact hash của non-managed command hook. Setup phải trả `installed-pending-trust`; người dùng mở `/hooks` để review/trust, và hook mới hoặc bị đổi tiếp tục bị Codex skip cho tới khi trust lại. Harnix không tự dùng `--dangerously-bypass-hook-trust`; trust là điều kiện cần nhưng `active` còn cần external authoritative activation evidence, nên regular CLI không claim active từ file/trust state suy đoán.

## 8. Internal context và activation guard

Mọi global skill/rule/instruction phải bắt đầu bằng guard tương đương:

1. Tìm initialized project ancestor/root gần nhất và an toàn từ cwd/workspace event; không yêu cầu `.harnix/config.yaml` nằm ngay trong current workspace directory.
2. Nếu không có `.harnix/config.yaml`, không áp dụng workflow và không tự chạy `harnix init`.
3. Nếu có, đọc `.harnix/workflow.md`, active task và bounded context theo contract hiện tại.
4. Nếu state initialized hiện hữu nhưng corrupt hoặc inaccessible, không đọc thêm project data; trả warning ngắn, platform-specific và đã redact, hướng dẫn dùng doctor nhưng không block host agent.

`harnix internal context` phải:

- Không network, không write, không log prompt/transcript/credential.
- Exit `0` và không output ở non-Harnix repo. Riêng Antigravity, optional event malformed cũng phải đi theo empty no-op; `{ "injectSteps": [] }` chỉ hợp lệ sau khi đã xác định initialized project nhưng không inject context.
- Giới hạn stdin, stdout, timeout và số workspace roots.
- Dùng platform-specific output renderer: plain text cho Kiro, `injectSteps` cho Antigravity, nested `hookSpecificOutput` hoặc plain developer context hợp lệ cho Codex.
- Không để malformed optional hook input làm mọi prompt global bị block; fail closed với project data nhưng fail open cho agent invocation.
- Non-Harnix fast path phải đo cả cold Node process startup và event parsing: release fixture yêu cầu median `<300ms`, p95 `<750ms` và không sample nào vượt `1s` trên supported CI OS. Regression vượt ngưỡng phải optimize CLI import/startup trước release.

## 9. Backward compatibility và migration

Không tự động copy hoặc xóa các surface project-local từ bản cũ.

1. `config.platforms` tiếp tục parse được nhưng bị deprecate/ignore cho desired project files.
2. `harnix update` không tái tạo `.kiro`, `.gemini`, `.codex`, `.agents/skills`, root `GEMINI.md` hoặc platform block do setup cũ sinh.
3. Sau global setup, doctor inventory project-local Harnix surfaces và phân loại `unchanged`, `modified`, `untracked`, `duplicate-hook`.
4. Explicit legacy cleanup chỉ xóa unchanged **standalone** path khi project manifest v1 chứng minh đúng source/path Harnix sở hữu; modified/untracked luôn preserve. Root/shared files như `AGENTS.md`, `GEMINI.md`, `.codex` config/hooks và arbitrary user file chỉ inventory, không bao giờ là deletion target.
5. Root `AGENTS.md` bootstrap do `init` đã tạo được giữ để tương thích với yêu cầu agent onboarding hiện tại; đây là explicit `init` exception, không phải platform surface do `setup` tạo. Global Codex block phải ngắn và conditional để tránh mâu thuẫn. Việc bỏ root bootstrap là product decision riêng, không nằm trong refactor này.
6. Setup từ repo A rồi repo B trên cùng fake/user home phải byte-idempotent và không thay ownership theo repo cuối cùng.

## 10. Work breakdown và dependency

| ID | Task | Effort | Phụ thuộc | Exit criteria |
|---|---|---:|---|---|
| G0 | Cập nhật PRD/workflow/research/baseline/mapping/README/AGENTS contract theo plan đã duyệt | M | Không | Không còn statement “setup project-local” hoặc schema cũ trong normative docs. README ghi rõ implementation version hỗ trợ behavior mới. |
| G1 | Viết RED tests với temporary repository + temporary user home | M | G0 | Test fail đúng vì setup còn đọc project config/path cũ; test process không thể chạm real home. |
| G2 | Thêm `HomeResolver`, safe user path, logical display path, permission-preserving atomic write và cross-process lock | L | G1 | Traversal/symlink/root/mode/concurrency/rollback tests pass. |
| G3 | Thêm global manifest/reconcile transaction | L | G2 | Hai repo dùng chung home không ghi đè ownership; modified content được preserve. |
| G4 | Refactor Kiro adapter sang current user-global contract | M | G3 | Skills/steering/hook v1 snapshot pass; non-Harnix hook no-op. |
| G5 | Refactor Antigravity Desktop + CLI plugin adapters và multi-root protocol | L | G3 | Hai plugin roots pass schema; invocation 0 inject đúng, multi-root ambiguity không leak data. |
| G6 | Refactor Codex skills/AGENTS/hooks current schema | L | G3 | `$HOME/.agents` + `$CODEX_HOME` fixtures pass; unrelated hooks/instructions preserved; Windows launcher smoke pass. |
| G7 | Tách CLI/lifecycle `setup`, global `update`, doctor v2, `uninstall` khỏi project lifecycle | L | G4-G6 | Setup chạy ngoài repo; status/readiness đầy đủ; fixes/uninstall đúng scope và confirmation. |
| G8 | Legacy project-surface diagnosis và explicit cleanup | M | G7 | Không duplicate hook sau cleanup; modified local surface không bị xóa. |
| G9 | Cập nhật templates/AGENTS guard, scripts packaging/smoke/footprint/release scan | M | G7-G8 | Tarball smoke dùng isolated home; không có project platform output mới hoặc machine path. |
| G10 | Full acceptance + disposable Windows profile smoke | M | G9 | Tất cả gate pass fresh; actual profile chỉ được dùng sau preview và explicit authorization. |

Critical path: `G0 -> G1 -> G2 -> G3 -> (G4, G5, G6) -> G7 -> G8 -> G9 -> G10`.

Trạng thái delivery: G0–G9 và phần automated của G10 đã hoàn tất với fresh evidence trong current working tree. G10 manual disposable-profile/tool-session smoke vẫn pending explicit authorization; không sử dụng real user profile và không suy automated evidence thành activation thật.

## 11. Test và acceptance bắt buộc

### 11.1 Focused regression inventory

- Setup không cần init/config và chỉ write vào injected home.
- Init/project update không tạo Kiro/Antigravity/Codex setup surface global hoặc project-local; root `AGENTS.md` bootstrap là explicit init exception.
- Mọi platform setup rerun idempotent; multi-platform preflight failure không để partial writes.
- Shared JSON/Markdown giữ unrelated content và modified Harnix content.
- Hai temp repositories dùng chung temp home không tranh ownership.
- Global hook no-op ở repo thường, hoạt động ở initialized repo, không block khi optional input malformed và không leak absolute path.
- Antigravity zero/one/multi-root, invocation >0, malformed event empty no-op và external-evidence shadowed workspace hook.
- Codex nested hook schema, multiple hook sources, `AGENTS.override.md`, `CODEX_HOME` và Windows command resolution.
- Codex `installed-pending-trust`, `/hooks` review flow và changed-hook hash yêu cầu trust lại.
- Kiro current v1 schema, global/workspace duplicate hook và externally supplied capability evidence; không có automatic version probe.
- Global uninstall confirmation, modified-file preservation, symlink escape, rollback và lock contention.
- Rollback concurrent-edit protection; stale/crashed lock recovery; pre-existing untracked `harnix-*` skill/plugin collision phải preserve, không auto-baseline.
- Nested cwd discovery trong Git và non-Git workspace, realpath-deduped roots và symlink boundary.
- File mode preservation trên POSIX; junction containment trên Windows.
- Test mode fail closed nếu global lifecycle thiếu injected home. Subprocess smoke đặt `HOME`, `USERPROFILE` và `CODEX_HOME` vào disposable roots; release test không đọc/ghi real profile.

### 11.2 Release gates

```text
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:acceptance
pnpm pack:check
pnpm smoke:tarball
pnpm measure:init
pnpm measure:footprint
pnpm scan:release
git diff --check
```

`smoke:tarball` phải dùng **hai root tạm độc lập**: fake user home cho global setup và one-or-more temp repositories cho project init/context. Test không được mutate home/config thật hoặc gọi network/install ngoài boundary explicit.

Manual smoke sau automated gates:

1. Dùng disposable Windows user/profile để mở session trong tool. Explicit test home chỉ phù hợp command-side check nếu tool cũng được launch cùng home đó.
2. Chạy `harnix setup --kiro --antigravity --codex --dry-run` và kiểm logical targets.
3. Chạy `harnix setup --kiro --antigravity --codex`, mở session mới trong từng tool và kiểm skill discovery/hook activation.
   Với Codex, mở `/hooks`, review/trust exact Harnix hook rồi mới claim active.
4. Kiểm repo chưa init không nhận Harnix context; repo đã init nhận đúng bounded context.
5. Chạy `harnix doctor`, preview bằng `harnix uninstall --global --kiro --antigravity --codex`, chỉ apply `harnix uninstall --global --kiro --antigravity --codex --yes` sau khi đã kiểm target, rồi verify unrelated global config còn nguyên.

## 12. Rủi ro và mitigation

| Rủi ro | Mức | Mitigation |
|---|---|---|
| Global hook ảnh hưởng mọi workspace | Critical | Explicit platform flags, dry-run, fixed command, 5s timeout, no-op guard, scoped uninstall. |
| Ghi đè user config/credentials | Critical | Structural merge, manifest hashes, preserve mode, preflight + rollback, không chạm settings/MCP/auth. |
| Hai project sở hữu cùng global file | High | Manifest theo target root, không lưu ownership trong project config/manifest. |
| Hook cũ và mới chạy trùng | High | Doctor duplicate detection và explicit manifest-backed legacy cleanup. |
| Platform schema tiếp tục drift | High | Dated official fixtures, external authoritative capability evidence khi có, doctor warning và release revalidation; không dùng unverified automatic version probe. |
| Binary không có trên PATH trong IDE | High | Setup/doctor lookup, Windows shim smoke; không persist absolute executable path. |
| Antigravity multi-folder đọc nhầm project | High | Active-root selection deterministic; ambiguity fail closed và không inject project data. |
| Shared config concurrent write | Medium | Cross-process lock, atomic replacement, snapshot rollback, fault-injection tests. |
| Codex hook đã cài nhưng chưa trust | High | Readiness `installed-pending-trust`, hướng dẫn `/hooks`, không bypass trust và manual activation evidence. |
| Người dùng hiểu “mọi VS Code” | Medium | README ghi rõ product-specific IDE/CLI scope và yêu cầu session reload. |

## 13. Definition of done

Refactor chỉ hoàn tất khi:

- `setup` chạy thành công từ thư mục không có `.harnix` và chỉ tạo official user-global surfaces.
- Project mới sau `init` không cần chạy per-project setup để Kiro/Antigravity/Codex thấy Harnix skills/hooks đã cài global.
- Non-Harnix repo không bị prompt delay đáng kể, context injection, write hoặc failure do Harnix global hook.
- Mọi global write có dry-run/status, conservative ownership, atomicity, rollback và safe uninstall.
- Doctor có schema phân biệt installed, active, shadowed, drifted, unsupported-version và project-not-initialized; `active`, `shadowed` và `unsupported-version` chỉ được claim với external authoritative evidence, còn regular CLI giữ conservative status.
- Codex chỉ được claim hook active sau review/trust **và** external activation evidence; file presence chỉ chứng minh installed.
- Không có Kiro/Antigravity/Codex setup output project-local mới; root `AGENTS.md` do `init` tạo là exception đã khóa. Không có duplicate hook, absolute home path, secret, permission change, runtime copy hoặc silent network.
- Tất cả automated gates và manual disposable-profile smoke pass với fresh evidence.

Trạng thái hiện tại: automated gates/isolated-home smoke đã pass với fresh evidence trong current working tree; manual disposable-profile/tool-session smoke chưa chạy vì thiếu explicit authorization và vẫn là điều kiện acceptance còn lại.
