export type StatusMode = "workspace" | "checks" | "criteria" | "summary" | "explain" | "plain";

export interface StatusModeFlags {
  explain?: boolean | undefined;
  summary?: boolean | undefined;
  criteria?: boolean | undefined;
  checks?: boolean | undefined;
  workspace?: boolean | string | undefined;
}

type Conflict = "explain" | "summary" | "criteria" | "checks" | "limit";

/** The projections that stand alone, in precedence order, with the options each refuses to be combined with. */
const STANDALONE: readonly {
  mode: "workspace" | "checks" | "criteria";
  flag: string;
  refuses: readonly Conflict[];
}[] = [
  { mode: "workspace", flag: "--workspace", refuses: ["explain", "summary", "criteria", "checks", "limit"] },
  { mode: "checks", flag: "--checks", refuses: ["explain", "summary", "criteria", "limit"] },
  { mode: "criteria", flag: "--criteria", refuses: ["explain", "summary", "limit"] },
];

function present(flags: StatusModeFlags, limitGiven: boolean, name: Conflict): boolean {
  return name === "limit" ? limitGiven : flags[name] === true;
}

function joinFlags(names: readonly string[]): string {
  return names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
}

/** Picks the projection `harnix status` prints and rejects options that cannot be combined with it. */
export function resolveStatusMode(flags: StatusModeFlags, limitGiven: boolean): StatusMode {
  for (const { mode, flag, refuses } of STANDALONE) {
    const selected = mode === "workspace" ? flags.workspace !== undefined : flags[mode] === true;
    if (!selected) continue;
    if (refuses.some((name) => present(flags, limitGiven, name)))
      throw new Error(`${flag} cannot be combined with ${joinFlags(refuses.map((name) => `--${name}`))}.`);
    return mode;
  }
  return flags.summary === true ? "summary" : flags.explain === true ? "explain" : "plain";
}
