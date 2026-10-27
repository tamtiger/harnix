# PRD — README: mot version duy nhat o dau trang, refactor lai noi dung

## Outcome

Nguoi doc README thay dung mot version so, ngay o dau trang, khong phai doc het bai hoac gap hai con so khac nhau vi lech dong bo. Noi dung "Trang thai" de doc hon nho duoc trinh bay lai thanh bullet thay vi mot doan van dai.

## Pham vi

- Them mot dong version badge ngay sau tieu de H1.
- Xoa hai cho nhac version rai rac giua bai (trong "Trang thai" va trong "Workflow su dung"), thay bang tham chieu ve dong badge.
- Cap nhat `scripts/version-sync.mjs` va `test/unit/version-sync.test.ts` de contract chi con dung mot managed marker.
- Them "Muc luc" ngay sau dong version.
- Viet lai "Trang thai" thanh bullet list, giu nguyen tung fact.

## Quyet dinh va ranh gioi

### AC `ac-1`

README.md hien thi dung mot chuoi version duy nhat, dat ngay sau H1; khong con noi nao khac trong README lap lai chuoi version do.

### AC `ac-2`

`scripts/version-sync.mjs` chi enforce/replace dung mot pattern version trong README.md; prose lien quan trong README mo ta dung "mot" claim.

### AC `ac-3`

`test/unit/version-sync.test.ts` duoc cap nhat dung theo contract mot-marker moi va toan bo test lien quan pass.

### AC `ac-4`

README co muc "Muc luc" ngay sau dong version, va "Trang thai" duoc viet lai thanh bullet, khong mat fact nao so voi ban cu.

### AC `ac-5`

`pnpm version:sync` chay that (bump version) thanh cong voi contract moi; lint/typecheck/build/test:acceptance (tru `test/unit/package-contract.test.ts` da biet la pre-existing/ngoai pham vi) deu xanh.

## Rui ro

- Refactor noi dung qua rong co the lam sai lech fact ky thuat da duoc kiem chung; mitigation: gioi han refactor noi dung o "Muc luc" va "Trang thai", giu nguyen cac phan CLI/platform khac nguyen van.
- Doi contract version-sync co the anh huong tool/script khac dang dua vao hai marker; mitigation: grep toan repo truoc khi doi, chi tim thay script va 1 test lien quan.
