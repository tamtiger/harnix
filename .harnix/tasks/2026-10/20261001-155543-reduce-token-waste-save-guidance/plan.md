# Plan - 3 cai tien giam token

## Slices
- [x] S1. Validator gop loi: chay cac assert theo nhom doc lap trong try/catch, thu TaskValidationError vao list, throw mot lan noi bang '; '. Dung aggregate sau loi cau truc goc de tranh cast crash. Giu nguyen van moi message cu.
- [x] S2. Skill harnix-plan: sua bullet Build the task liet ke day du rang buoc --save + dan doc --schema mot lan, gop bullet sorted cu.
- [x] S3. Cookbook workflow.md: them mau --save toi thieu, compound --run-check, guarded replan; cap nhat persistence-guidance.test.ts.
- [x] S4. Verify: format/lint/typecheck/test; run-check; finish.

## Rui ro
Validator la loi nhieu test assert message -> giu nguyen van tung chuoi. Chi aggregate nhom shape doc lap, dung sau loi cau truc goc.
