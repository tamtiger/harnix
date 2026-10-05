# Kế hoạch — Đồng bộ tài liệu, skill, test cấu trúc và phát hành 2.0.5

Làm **sau** task 3–5. Trước khi `ready`, rà lại PRD mục "Kết quả rà soát" với trạng thái code cuối và bổ sung mục phát sinh.

## Checklist theo slice

- [ ] Slice 1 (ac-1): `test/workflow/architecture.test.ts` bắt dynamic `import()`, side-effect import và `fs` thiếu `node:`; core cấm import `configurators`; fixture vi phạm chứng minh bộ quét hoạt động.
- [ ] Slice 2 (ac-2): `workflow --init` lấy lệnh/input mặc định từ `verify-plan`, `--mode` sai báo lỗi, slug không kết thúc bằng `-`, thời gian chỉ qua `src/utils/clock.ts`, `--input` tách theo dấu phẩy.
- [ ] Slice 3 (ac-3): dọn skill/reference: bỏ quy ước riêng repo (`pnpm format/lint`, `version:sync`, mirror `test/unit`), bỏ `**Verifies:**`, cập nhật `replan.md` (`--replace-check`, bản thay phải khác) và `ready-review.md` (lệnh suite).
- [ ] Slice 4 (ac-8): reference `multi-repo` của `harnix-plan`; cập nhật `evidence.md` (run-check đúng `command`/`cwd`, evidence không tương lai, breaker `stop`), trỏ breaker trong `harnix-debug`, cookbook nhắc reference; cập nhật catalog skill và test.
- [ ] Slice 5 (ac-4): sửa số platform (help `--platform`, `cli-program.ts`, `uninstall.ts`, README, `test/README.md`, PRD, GLOBAL_SETUP, UPSTREAM_MAPPING); mở rộng `supported-platforms.test.ts`.
- [ ] Slice 6 (ac-5): thống nhất quy tắc approval (PRD:402, WORKFLOW:12,:290), help `status --summary` 80 token, `evidence.md` (`evidence-expired`, `__pycache__`, `.git`), `--schema.transports` đủ, `test/README.md` sàn coverage, `docs/prompts/*` cũ.
- [ ] Slice 7 (ac-9): `HARNIX_UPDATE_GOLDEN` thất bại trong CI; nâng sàn đếm test/assertion; sửa lý do `src/index.ts` và comment ESLint lỗi thời.
- [ ] Slice 8 (ac-6): bỏ tên repo khách hàng khỏi CHANGELOG; `pnpm version:sync 2.0.5 --summary ...` một lần; `harnix update` đồng bộ `.harnix/workflow.md` và hash; `harnix doctor` không tăng cảnh báo.
- [ ] Slice 9 (ac-7): `typecheck`, `lint`, `test` (coverage), `pack:check`, `smoke:tarball`, `scan:release` xanh cục bộ rồi ghi evidence bằng `--run-check`.

## Thứ tự RED rồi GREEN

- **Slice 1:** RED `architecture.test.ts` với fixture chứa `await import("...")`, `import "x"`, `import fs from "fs"`, core import `configurators` (thất bại vì bộ quét chưa bắt). GREEN: mở rộng regex và danh sách cấm.
- **Slice 2:** RED `init-task.test.ts` (mặc định theo `verify-plan`, mode lạ, slug cuối `-`, `--input a,b`). GREEN: sửa `init-task.ts` và `workflow-handlers.ts`.
- **Slice 3, 4:** RED là test nội dung skill (`skill-sources.test.ts`/`technique-skills.test.ts`/test mới) khẳng định skill không chứa chuỗi riêng repo, có reference `multi-repo`, `replan.md` nhắc `--replace-check`. GREEN: sửa Markdown. Hướng dẫn thuần văn bản dùng ngoại lệ TDD, thay bằng test nội dung và `instruction-budget`.
- **Slice 5:** RED mở rộng `supported-platforms.test.ts` quét các file nêu trên cho đủ 6 platform. GREEN: sửa từng vị trí.
- **Slice 6:** RED test parity: help `status --summary` khớp 80 token, `--schema.transports` đủ khóa, `docs-task-contract.test.ts` kiểm quy tắc dừng `await`. GREEN: sửa.
- **Slice 7:** RED test cho nhánh CI của golden (đặt `CI=true` và `HARNIX_UPDATE_GOLDEN=1` thì thất bại). GREEN: sửa `behavior-snapshot.test.ts`.
- **Slice 8:** `version-sync.test.ts` và `package-contract.test.ts` là hàng rào; `scan:release` quét tên khách hàng/đường dẫn máy.

## Mỗi check chứng minh điều gì

- `check-structure` (`pnpm vitest run test/workflow test/unit`): ac-1, ac-2, ac-3, ac-4, ac-5, ac-8, ac-9.
- `check-version`: version/CHANGELOG khớp (ac-6). `check-scan`: không còn tên khách hàng/đường dẫn máy trong tarball (ac-6).
- `check-typecheck`, `check-lint`, `check-suite`: cổng chất lượng cuối (ac-7).

## Bảo toàn

Golden chỉ sinh lại nếu `workflow --schema` đổi (slice 6 thêm khóa transports): xem diff, chỉ giữ phần chữ schema. Không hạ sàn coverage. Không commit khi chưa được duyệt. File `.harnix/` và `docs/prompts/harnix-comprehensive-review.md` chưa theo dõi: giữ nguyên.
