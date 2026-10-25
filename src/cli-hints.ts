import type { Command } from "commander";

const HINT_MARKER = "\nGợi ý: ";

/** Splits a message into the error itself and its `Gợi ý:` lines or Commander's `(Did you mean …?)` suggestion. */
export function splitHint(message: string): { message: string; hint?: string } {
  const marker = message.indexOf(HINT_MARKER);
  if (marker >= 0)
    return { message: message.slice(0, marker), hint: message.slice(marker + HINT_MARKER.length).trim() };
  const suggestion = /\n\((Did you mean [^)]+\?)\)\s*$/u.exec(message);
  if (suggestion !== null) return { message: message.slice(0, suggestion.index), hint: suggestion[1]! };
  return { message };
}

function commandsWithOption(program: Command, flag: string): string[] {
  return program.commands
    .filter((command) => command.options.some((option) => option.long === flag || option.short === flag))
    .map((command) => command.name());
}

/**
 * Hints Commander cannot give: an option that exists, but on another command, and a `--run-check` whose command was
 * not put after `--`, so its own options were read as harnix options.
 */
export function commandHints(program: Command, argv: readonly string[], message: string): string {
  const hints: string[] = [];
  const unknown = /unknown option '(-{1,2}[\w-]+)'/u.exec(message);
  const invoked = argv[2];
  if (unknown !== null) {
    const owners = commandsWithOption(program, unknown[1]!).filter((name) => name !== invoked);
    if (owners.length > 0)
      hints.push(
        `${unknown[1]} không thuộc harnix ${invoked}; nó dùng với ${owners.map((name) => `harnix ${name}`).join(", ")}.`,
      );
    if (invoked === "workflow" && argv.includes("--run-check") && !argv.includes("--"))
      hints.push("Đặt lệnh cần chạy sau dấu --: harnix workflow --run-check <check-id> -- <exe> [args...].");
  }
  if (hints.length === 0) return message;
  const { message: base, hint } = splitHint(message);
  return `${base}${HINT_MARKER}${[...hints, ...(hint === undefined ? [] : [hint])].join(" ")}`;
}
