# What a review must disclose

A review that lists only what was found hides how far the reading went. Every review carries the first two sections below; the third applies only when a second reviewer is used (none is required).

## Could-Not-Verify

List every requirement, path or behavior you could not judge and why (no access, no test, not run, out of scope). Keep the section even when empty and write "none" so the reader knows it was considered. An empty list is a claim: be able to say which checks and reads back it.

## Tried to disprove, found nothing

When a suspicion did not hold, say what you tried and what the code showed (the guard you found, the caller you traced, the test you ran). "No finding" without this line says only that nothing was seen; with it, the reader can repeat the attempt.

## Independent reviewer (only when a second reviewer is used)

A second reviewer, whether a subagent or another pass, receives the thesis under review and the evidence for it: the diff, the requirement, the test output. It does not receive the author's reasoning, the summary of why the change is fine, or a hypothesis to confirm; a reviewer handed a conclusion tends to confirm it. The reviewer lists findings and does not edit; one writer owns the artifact. If a reviewer finds nothing, ask the same question: what did it try?

Verdicts, triage and evidence gaps stay in `finding-triage`; this note only adds what the review must disclose.
