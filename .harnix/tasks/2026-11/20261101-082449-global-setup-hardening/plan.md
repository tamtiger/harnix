# Plan: Siết setup global và an toàn symlink

## Execution Slices

### Slice 1: notice không bị nuốt (ac-1)

- [x] [chk-focused] ac-1: test đỏ với `commandLookup: async () => false` cho Codex/Antigravity/OpenCode, rồi sửa `platformResult` để thêm cả `LAUNCHER_WARNING` và `setupNotice`.

### Slice 2: atomic write theo symlink nội bộ (ac-3)

- [x] [chk-focused] ac-3: test đỏ (symlink còn nguyên, nội dung đích thật đổi, symlink treo bị từ chối), rồi resolve realpath trong `atomicWriteFile`.

### Slice 3: đọc không thoát root qua symlink (ac-5, ac-6)

- [x] [chk-focused] ac-5: test đỏ cho skill/SKILL.md/reference là symlink ra ngoài, rồi bỏ qua trong `discoverProjectSkills`.
- [x] [chk-focused] ac-6: test đỏ cho manifest symlink ra ngoài, rồi dùng helper đọc có kiểm realpath ở hai `readSafeText`.

### Slice 4: đóng gói

- [x] [chk-suite] Bump version `pnpm version:sync`, đồng bộ CHANGELOG, `pnpm format`, chạy `chk-suite`.

## Guardrails & Invariants

- Không chạm home thật; fixture symlink chỉ trong thư mục tạm, bỏ qua có điều kiện kèm lý do khi hệ điều hành không cho tạo symlink.
- Symlink ra ngoài root vẫn bị `resolveSafeUserPath` chặn ở caller.
- Không đổi frozen contract.

## Verification Matrix

| Tiêu chí | Check |
| --- | --- |
| ac-1, ac-3, ac-5, ac-6 | chk-focused (vitest thu hẹp) |
| ac-1, ac-3, ac-5, ac-6 | chk-suite (`pnpm run test`) |
