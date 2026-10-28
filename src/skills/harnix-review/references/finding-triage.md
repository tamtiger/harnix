# Finding triage

Triage each candidate finding before it is reported, whether it comes from you, a lens or a subagent (no subagent is required).

## Try to disprove it

Ask: is the input already validated upstream; does an authentication or authorization guard cover the path; does the framework default make it safe; is the code dead or test-only; does another control compensate? Quote the evidence for each answer.

Verdict: **CONFIRMED** (no disproof holds), **DISPROVED** (drop it and say why), **DOWNGRADED** (real but lower severity; state the new one and the reason).

## One destination

Each confirmed finding has one destination: a defect goes back to `harnix-implement`; a missing decision goes to replan; missing evidence goes to research or a check; work that blocks nothing becomes a follow-up task or `--add-risk`.

## Evidence gaps

A requirement with no quoted evidence is `Not assessed`, never `Pass`; list it with what would assess it.
