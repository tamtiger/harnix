import { WORKFLOW_ACTIONS, actionFlagName } from "./actions.js";

/** How `--reason` applies to an action; an action not listed does not accept it. */
export type ReasonRule = "required" | "after-planning" | "optional";

export const REASON_RULES: Readonly<Record<string, ReasonRule>> = {
  setCheck: "after-planning",
  removeCheck: "after-planning",
  addCriterion: "after-planning",
  setCriterion: "after-planning",
  replaceCheck: "required",
  resetBreaker: "required",
  cancel: "required",
  transition: "optional",
  setTitle: "optional",
  setGoal: "optional",
};

/** An optional `--reason` of set-title and set-goal is only validated (10-1000 characters when given), then dropped: nothing stores it. */
export function assertOptionalReason(reason: string | undefined): void {
  const length = reason?.trim().length;
  if (length !== undefined && length !== 0 && (length < 10 || length > 1000))
    throw new Error("--reason must be 10-1000 characters.");
}

const TEXT: Record<ReasonRule, string> = {
  required: "required (10-1000 characters)",
  "after-planning": "optional in planning, required (10-1000 characters) after planning",
  optional: "optional (10-1000 characters when given)",
};

/** Actions whose reason travels inside the stdin or file envelope instead of the `--reason` flag. */
const IN_ENVELOPE: Record<string, string> = {
  batch: "not a flag: envelope reason, optional in planning, required (10-1000 characters) after planning",
  save: "not a flag: contractRevision.reason (10-1000 characters) when superseding obligations at replan",
};

/** `--schema` constraint: for each action flag, whether `--reason` is required, optional or not accepted. */
export function reasonConstraints(): Record<string, string> {
  return Object.fromEntries(
    WORKFLOW_ACTIONS.map((spec) => {
      const rule = REASON_RULES[spec.name];
      return [actionFlagName(spec.name), rule === undefined ? (IN_ENVELOPE[spec.name] ?? "not accepted") : TEXT[rule]];
    }),
  );
}
