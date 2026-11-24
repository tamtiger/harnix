# Giảm nhiễu git: .harnix/.gitignore và .gitattributes do init và update ghi

- **ID:** 20261124-232023-git-hygiene
- **Mode:** lite
- **Epic:** 20261124-232018-harnix-friction-fixes
- **Status:** planning/planning
- **Created:** 2026-11-24 23:20:23 +07:00
- **Updated:** 2026-11-24 23:21:28 +07:00

**Verdict:** PENDING — 0/4 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/4 met or waived |
| Required checks | 0% | 0/2 passed |

## Goal

Bớt nhiễu git cho repo dùng Harnix: file ignore và line ending của riêng .harnix do init và update ghi, mà không đụng file gốc của người dùng.

## Acceptance criteria

- [ ] `ac-1` (pending): `harnix init` và `harnix update` ghi `.harnix/.gitignore` (`cache/`, `tmp/`, `tasks/.active`) và `.harnix/.gitattributes` (`* text eol=lf`) có đánh dấu managed, idempotent, không ghi đè bản người dùng đã sửa (theo manifest hash), không đụng `.gitignore` hay `.gitattributes` gốc; nằm trong manifest và `uninstall --purge` gỡ chúng.
- [ ] `ac-2` (pending): Finding doctor `cache-tracked` và `active-pointer-tracked` in đúng lệnh `git rm --cached ...` cần chạy; harnix không tự chạy git; mức severity không đổi.
- [ ] `ac-3` (pending): Journal vẫn được theo dõi mặc định (decision ghi lại lý do: ignore sẽ mất lịch sử khi đổi máy); tài liệu nói rõ cách ignore nếu người dùng muốn. Việc gỡ `.harnix/cache/repo-map-v1.json` khỏi index của chính repo harnix là thao tác git riêng, chỉ làm khi người dùng cho phép, không nằm trong code.
- [ ] `ac-4` (pending): Docs (PRD, README), CHANGELOG, test init/update/doctor và phiên bản `2.40.0-dev.5` đồng bộ; kiểm bằng CLI thật qua `scripts/exercise-git-hygiene.mjs` (repo git tạm: sau `repo-map` thì `git status` không hiện cache; `update` lần hai không đổi file; file người dùng đã sửa được giữ).

## Required checks

- [ ] `check-suite` (full): Toàn bộ test của dự án phải xanh — chưa chạy / not yet run
- [ ] `chk-focused` (focused): Test hợp đồng nhanh (docs, CLI, ngân sách token, nguồn skill) — chưa chạy / not yet run

## Decisions

- **dec-journal-tracked** — Journal vẫn theo dõi mặc định: ignore sẽ mất lịch sử khi đổi máy; chỉ ignore cache, tmp, tasks/.active. Ghi file vào .harnix/ thay vì .gitignore gốc để không đụng file của người dùng.
  - _Why:_ Cần người dùng xác nhận khi duyệt epic.

## Evidence

_None recorded yet._
