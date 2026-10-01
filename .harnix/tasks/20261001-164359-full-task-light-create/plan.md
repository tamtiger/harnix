# Plan - Full task nhe

## Slices
- [x] S1. Bo guard save.ts:147 (candidate.mode full && !envelope.artifacts -> throw). Giu nguyen phan con lai: khi artifacts undefined, plannedSaveFiles chi ghi task.json; validateTaskArtifacts chi chay khi co artifacts. RED: sua envelope.test.ts assert tao full khong artifacts thanh cong + ready chan khi thieu.
- [x] S2. Skill harnix-plan + cookbook workflow.md: mo ta luong nhe (--save JSON nho, viet prd.md/plan.md bang editor tool, ready gate chan). Cap nhat persistence-guidance.test.ts neu them needle.
- [x] S3. Verify: format/lint/typecheck/test; regenerate .harnix/workflow.md; run-check; finish.

## Rui ro
Cham core save path. Ready gate la chot that - phai giu nguyen. Nhieu test gia dinh artifacts bat buoc luc save (envelope.test.ts) -> flip dung intent moi.
