# What implementation uncovers

Something new found while implementing goes to exactly one tier, the lowest that fits:

1. **Local judgment:** a detail inside the slice that changes no criterion, contract or check. Decide it and move on.
2. **An implementation-only note:** a lesson for this task or later ones, including Guidance for a following task. Record it with `--add-decision` or `--add-risk`; it changes no obligation.
3. **Out-of-scope follow-up:** valid work the task does not own. Start it with `harnix workflow --init --follow-up <task-id>` (or add an epic member with `--no-activate`) and finish the current task unchanged.
4. **Replan:** the requirement or design must change. Set checkpoint `replan` with `--reason` and hand back to `harnix-plan`; never code around it.
