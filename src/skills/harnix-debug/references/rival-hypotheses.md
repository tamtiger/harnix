# Rival hypotheses

Use when one symptom has two or more plausible causes, or the first hypothesis failed. It sharpens the loop in `feedback-loop`; it does not replace it: still one hypothesis at a time, one variable per run.

## Write the signatures first

For each rival cause write its expected signature before you look at the evidence: what you would observe at each boundary if that cause were true, and what you would not observe. Signatures written after the run get bent to fit it.

## Choose the check that separates them

Pick the cheapest observation where the rivals predict different results. Then read the result honestly:

- a prediction that must hold failed: that rival is out;
- a result only one rival predicts: strong support, still not proof;
- a result every rival predicts: not enough to tell them apart. Say so, record it and choose a sharper observation instead of leaning on the closest fit.

## Keep the losers

A ruled-out cause becomes a negative constraint: record the observation that eliminated it (`--add-decision`, or a finding on the failed check) so a later fix does not rebuild it and a new idea does not silently revive it.

## Do not loosen the alarm

When an invariant, assertion or check fails, do not relax, skip or widen it until the input shape, preprocessing, version, ordering and environment have been checked. The failing check is evidence about the cause, not noise to silence.

## Limits

Three distinct failed hypotheses for one symptom still mean stop, reassess the assumptions and replan. A rival you cannot test cheaply is a question for `harnix-research`, not a guess to apply.
