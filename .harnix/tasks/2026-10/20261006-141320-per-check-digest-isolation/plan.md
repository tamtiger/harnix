# Kế hoạch: per-check-digest-isolation

Thứ tự: RED (thất bại đúng lý do) → GREEN tối thiểu → test hẹp → tick `[x]`. Test dựng bằng `test/support/builders.ts`; mỗi file test ≤ 400 dòng; mỗi file nguồn ≤ 300 dòng code.

- [x] S1 Hợp đồng và công thức digest theo check (ac-2)
- [x] S2 Cô lập khỏi check và tiêu chí không liên quan (ac-1)
- [x] S3 Nhận digest công thức cũ qua hàm so khớp duy nhất (ac-3, ac-4)
- [x] S4 Dùng hàm so khớp ở mọi nơi và ẩn `legacyInputDigest` khỏi `--snapshot` (ac-4)
- [x] S5 Tài liệu và golden (ac-5)
- [x] S6 Hoàn tất: bump `2.2.0-dev.3`, CHANGELOG, format, lint, typecheck, đồng bộ `.harnix/workflow.md`

## S1 — Hợp đồng và công thức theo check

- RED trong `test/unit/core/verification/input-digest.test.ts`: đổi `command`, `inputs`, `cwd`, `scope`, `required`, `description`, `criterionIds` của chính check đều đổi `inputDigest`; đổi text một tiêu chí mà check phủ đổi digest; đổi `mode` đổi digest; đổi `decisions` vẫn không đổi (đã có).
- GREEN trong `src/core/verification/input-digest.ts`: thay `canonicalTaskContract` bằng `canonicalCheckContract(task, check)`, `taskContractHash = hashText(canonicalCheckContract(...))`, `digest: 4`. Giữ `canonicalTaskContract` dưới tên `legacyTaskContract` chỉ để tính công thức cũ.

## S2 — Cô lập

- RED: (a) digest của check A không đổi khi thay hoặc sửa check B không liên quan (đổi command, thêm check, đổi `required` của B); (b) không đổi khi thêm tiêu chí A không phủ hoặc đổi text tiêu chí A không phủ; (c) integration: dựng task v3 với hai check đã pass, chạy `replaceCheckWorkflow` cho check thứ hai (đã fail) và khẳng định `inspectRequiredChecks`/status vẫn coi check đầu là fresh (`test/unit/core/workflow/replace-check.test.ts` hoặc `test/integration/commands/checks.test.ts`).
- GREEN: không cần thêm mã ngoài S1; test chứng minh hành vi.

## S3 — Hàm so khớp và digest cũ

- RED trong `input-digest.test.ts`: `legacyInputDigest` bằng `sha256(JSON.stringify({ digest: 3, taskId, checkId, taskContractHash: hashText(<hợp đồng toàn task>), entries }))` tính độc lập trong test từ hợp đồng toàn task; `digestMatches` đúng với digest mới, đúng với digest cũ, sai với chuỗi khác và với `undefined`; digest cũ khớp khi hợp đồng chưa đổi nhưng không khớp sau khi đổi một check khác (an toàn: stale thật).
- GREEN: `InputDigestSnapshot` thêm `legacyInputDigest: string`; export `digestMatches(snapshot, recorded)`.

## S4 — Dùng ở mọi nơi

- RED: `test/workflow/task-contract-v3.test.ts` — task finishing với evidence digest công thức cũ (dựng bằng cách tính legacy trong test) vẫn finish được khi chưa đổi gì; sau khi sửa file input thì `assertInputDigestsFresh` ném lỗi stale; `--criterion` và `suite-gate` chấp nhận pass cũ; `test/unit/core/workflow/snapshot.test.ts` khẳng định output `--snapshot` không có `legacyInputDigest` nhưng có `taskContractHash`.
- GREEN: `check-report.ts`, `input-digest.ts` (hai assert), `criterion.ts`, `suite-gate.ts` dùng `digestMatches`; `snapshot.ts` bỏ `legacyInputDigest` khỏi kết quả. Grep xác nhận không còn so sánh trực tiếp `.inputDigest ===`/`!==` với digest tính lại.

## S5 — Tài liệu và golden

- Cập nhật: `AGENTS.md` (dòng về `@task-contract`), `docs/HARNIX_PRD.md` (các dòng về `@task-contract`, canonical task contract, digest mismatch), `docs/HARNIX_WORKFLOW.md` (digest gộp gì, token `@task-contract`, drift), `docs/IMPLEMENTATION_PLAN.md` (công thức `{digest, ...}`, `taskContractHash`, `--snapshot`), `docs/HARNESS_RESEARCH.md` (C3), `src/templates/harnix/workflow.md` (mục Verify), `src/skills/harnix-verify/references/evidence.md` (cái gì đổi `inputDigest`), `src/skills/harnix-verify/SKILL.md` nếu nhắc.
- Nội dung: digest của một check gồm id task, id check, mode, định nghĩa của chính check, id và text tiêu chí nó phủ, sha256 các file input; digest công thức cũ vẫn được nhận.
- Test parity trong `test/workflow/docs-task-contract.test.ts`: không còn cụm "folded into every digest" hay "luôn được gộp ngầm vào digest"; template và `evidence.md` nhắc legacy digest.
- Golden: `HARNIX_UPDATE_GOLDEN=1` chỉ sau khi xem diff chỉ gồm giá trị `taskContractHash` và `inputDigest` của kịch bản snapshot cùng các mô tả tài liệu liên quan.

## S6 — Hoàn tất

- `pnpm version:sync 2.2.0-dev.3 --summary ... --kind changed`; đồng bộ `.harnix/workflow.md` từ template và hash trong `.harnix/.template-hashes.json` (chuẩn hóa LF); `pnpm format`, `pnpm lint`, `pnpm typecheck`.
- `--run-check`: `check-digest`, `check-docs`, rồi `check-suite` cuối cùng; đánh dấu tiêu chí `met` bằng evidence của đúng check phủ nó; finish.

## Lưu ý

- Chỉ chạm các nơi so khớp digest đã ghi với digest tính lại; không đụng so sánh hai evidence với nhau.
- Tài liệu này nhắc token cấm chỉ trong code span để cổng ready không chặn nhầm.
