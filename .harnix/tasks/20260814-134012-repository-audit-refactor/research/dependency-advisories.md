# Research dependency advisories

## Câu hỏi

Cách loại hai advisory trong dev dependency tree mà vẫn giữ frozen toolchain `tsup`, Vitest và Node.js `>=18` là gì?

## Bằng chứng

- `pnpm audit --prod --audit-level low` không tìm thấy vulnerability trong production tree.
- Full audit tìm `nanoid@3.3.17` qua PostCSS của `tsup`/Vite. GitHub Advisory GHSA-2v37-7h3g-55p8 đánh dấu `<3.3.18` bị ảnh hưởng và `3.3.18` là bản vá.
- Full audit tìm `esbuild@0.27.7` qua `tsup`. GitHub Advisory GHSA-g7r4-m6w7-qqqr đánh dấu `>=0.27.3 <0.28.1` bị ảnh hưởng trên Windows và `0.28.1` là bản vá.
- `tsup@8.5.1` hiện vẫn khai báo `esbuild: ^0.27.0`; thay `tsup` bằng tool khác trái product boundary, còn nâng Vitest major có thể phá Node 18.
- Lockfile đã có `esbuild@0.28.1` qua Vite và Vitest hiện cài vẫn công bố Node `^18.0.0 || ^20.0.0 || >=22.0.0`.

## Quyết định

Pnpm 11 không còn đọc `package.json#pnpm.overrides`, còn `pnpm-workspace.yaml` bị frozen no-workspace contract cấm. Dùng local `.pnpmfile.mjs` chính thức với `readPackage` hook và hai rule exact theo package name, package version, dependency name và vulnerable range: `postcss@8.5.25` chuyển `nanoid ^3.3.16 -> 3.3.18`; `tsup@8.5.1` chuyển `esbuild ^0.27.0 -> 0.28.1`. Cùng hook `updateConfig` allow đúng build script của registry package `esbuild`; mọi package khác vẫn fail closed theo `strictDepBuilds`. Hook không thêm workspace, không ảnh hưởng package khác và không nằm trong published `files` whitelist. Chấp nhận cross-minor `esbuild` chỉ khi fresh frozen install, dependency audit, build, typecheck, full tests, acceptance, tarball smoke và release scan đều pass.

## Nguồn

- https://github.com/advisories/GHSA-2v37-7h3g-55p8
- https://github.com/advisories/GHSA-g7r4-m6w7-qqqr
- https://raw.githubusercontent.com/egoist/tsup/master/package.json
- https://pnpm.io/pnpmfile
