# What implementation uncovers

Something new found while implementing goes to exactly one tier, the lowest that fits:

1. **Local judgment:** a detail inside the slice that changes no criterion, contract or check. Decide it and move on.
2. **An implementation-only note:** a lesson for this task or later ones, including Guidance for a following task. Record it with `--add-decision` or `--add-risk`; it changes no obligation.
3. **Out-of-scope follow-up:** valid work the task does not own. Start it with `harnix workflow --init --follow-up <task-id>` (or add an epic member with `--no-activate`) and finish the current task unchanged.
4. **Replan:** the requirement or design must change. Set checkpoint `replan` with `--reason` and hand back to `harnix-plan`; never code around it.

A criterion that cannot be met as written goes to tier 4, not to a weaker test or a reworded criterion. Put in the `--reason` what would resolve it (the decision, the dependency, the changed contract or the evidence that is missing), so planning starts from the blocker rather than from a guess; never weaken a test or a criterion to make it pass.
