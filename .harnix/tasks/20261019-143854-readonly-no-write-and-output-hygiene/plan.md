# Implementation Plan: Lệnh read-only không ghi `.harnix` và làm sạch đầu ra tự sinh

## Hiện trạng đã đối chiếu với mã
- `src/core/workflow/secret-scan.ts` dòng 87: `globby(patterns, { cwd: root, onlyFiles: true, followSymbolicLinks: false, dot: true, ignore })`, không có `gitignore`; `input-digest.ts` thì có `gitignore: true`.
- `src/core/workflow/artifact-templates.ts`: dòng ràng buộc của PRD ("quy tắc giới hạn LOC") và hai dòng Guardrails của plan ("300 LOC/file trong src/core/", "commands -> core -> utils"); `test/unit/core/workflow/artifact-templates.test.ts` và `init-task.test.ts` kiểm tiêu đề các mục.
- `src/core/workflow/preflight.ts` dòng 69 và 146: `learning` chỉ khi `nextStage === "plan"`; `epicContext` khi không có task active; `brief.ts` `briefPreflight` bỏ `learning`.
- Các lệnh read-only (`status`, `verify-plan`, `repo-map`, `context-report`, `tasks`, `epic`, `workflow --preflight/--inspect`) dùng `findInitializedProject` hoặc `requireInitializedProject`, không tạo state.

## Hợp đồng (contract)
- `candidateFiles` trong `secret-scan.ts` gọi `globby` với `gitignore: true`; không đổi giới hạn `MAX_FILES`, `MAX_FILE_BYTES`, thứ tự file hay nội dung `SecretAdvisory`.
- `renderPrdTemplate`: dòng cuối khối 4 thành `- Mọi thay đổi tuân thủ AGENTS.md và các guide trong .harnix/spec/guides/ của dự án, và không để lọt rò rỉ bảo mật.`
- `renderPlanTemplate`: hai dòng Guardrails riêng của Harnix thành một dòng `- Tuân thủ các quy ước kiến trúc và giới hạn của dự án (AGENTS.md, .harnix/spec/guides/).`; không còn chuỗi `300 LOC` hay `commands -> core`.
- Các tiêu đề mục của PRD và plan giữ nguyên.

## Execution Slices

### Slice 1 (RED)
- [x] [chk-focus] `secret-scan.test.ts`: file chứa bí mật nằm trong đường dẫn có trong `.gitignore` không được báo, file chứa bí mật không bị ignore vẫn được báo. `artifact-templates.test.ts`: PRD và plan sinh ra không chứa `300 LOC`, `commands -> core`, `giới hạn LOC`, và vẫn có các tiêu đề cũ.
- [x] [chk-focus] `test/integration/scenarios/read-only-commands.test.ts` (mới): trong thư mục chưa init (có `package.json`), mỗi lệnh read-only chạy qua `runCli` không tạo hay đổi file nào (so `snapshotTree` trước và sau, kể cả không có `.harnix`). `brief.test.ts`: `briefPreflight` bỏ `learning` và giữ các trường còn lại.

### Slice 2 (GREEN)
- [x] [chk-focus] Sửa `secret-scan.ts` và `artifact-templates.ts`; nếu test read-only phát hiện lệnh ghi thật thì sửa lệnh đó; chạy lại các test của Slice 1.

### Slice 3: cổng hợp đồng và phát hành
- [x] [chk-gates] `pnpm run test:gates`; `pnpm version:sync 2.12.0-dev.7 --summary <text> --kind fixed` và changelog.
- [x] [check-suite] Toàn bộ `pnpm run test` một lần ở bước verify.

## Guardrails & Invariants
- Advisory vẫn offline, bị giới hạn và không bao giờ trả giá trị; không đọc ngoài `relevantPaths` và `inputs` của task.
- Không đổi đầu ra `--preflight`; không đổi tiêu đề mục mà cổng ready đọc.
- Mỗi file trong `src/` dưới 300 dòng code; test mới dưới 400 dòng; chỉ format đúng các file mình sửa.

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
| ac-1, ac-2, ac-3, ac-4 | chk-focus | `pnpm exec vitest run test/unit/core/workflow/secret-scan.test.ts test/unit/core/workflow/artifact-templates.test.ts test/unit/core/workflow/brief.test.ts test/integration/scenarios/read-only-commands.test.ts test/integration/commands/init.test.ts` | focused |
| ac-5 | chk-gates | `pnpm run test:gates` | focused |
| ac-5 | check-suite | `pnpm run test` | full |
