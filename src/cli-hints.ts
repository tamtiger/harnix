import type { Command } from "commander";
import { closestMatch } from "src/utils/suggest.js";

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

/** Commands that moved or never existed, mapped to what to run instead. */
const RENAMED_COMMANDS: Readonly<Record<string, string>> = { facts: "harnix update" };

/** Hints for an unknown command (the nearest real one) and for surplus arguments (the command takes none). */
function argumentHints(program: Command, message: string): string[] {
  const unknown = /unknown command '([^']+)'/u.exec(message);
  if (unknown !== null) {
    const replacement = RENAMED_COMMANDS[unknown[1]!];
    if (replacement !== undefined) return [`Dùng ${replacement}; \`harnix --help\` liệt kê các lệnh.`];
    const nearest = closestMatch(
      unknown[1]!,
      program.commands
        .filter((command) => !(command as { _hidden?: boolean })._hidden)
        .map((command) => command.name()),
    );
    return nearest === undefined ? [] : [`Có phải ý bạn là harnix ${nearest}?`];
  }
  const surplus = /too many arguments for '([\w-]+)'\. Expected (\d+) arguments? but got/u.exec(message);
  if (surplus === null) return [];
  const accepts = surplus[2] === "0" ? "không nhận đối số" : `nhận tối đa ${surplus[2]} đối số`;
  return [`harnix ${surplus[1]} ${accepts}; chạy harnix ${surplus[1]} --help để xem cờ.`];
}

/**
 * Hints Commander cannot give: an option that exists, but on another command, and a `--run-check` whose command was
 * not put after `--`, so its own options were read as harnix options.
 */
export function commandHints(program: Command, argv: readonly string[], message: string): string {
  const hints: string[] = [];
  const unknown = /unknown option '(-{1,2}[\w-]+)'/u.exec(message);
  // argv[2] is the command only when it names one; `harnix --limit 3` has no command at all.
  const invoked = program.commands.some((command) => command.name() === argv[2]) ? argv[2] : undefined;
  let ownerFound = false;
  if (unknown !== null) {
    const owners = commandsWithOption(program, unknown[1]!).filter((name) => name !== invoked);
    if (owners.length > 0 && invoked !== undefined) {
      ownerFound = true;
      hints.push(
        `${unknown[1]} không thuộc harnix ${invoked}; nó dùng với ${owners.map((name) => `harnix ${name}`).join(", ")}.`,
      );
    }
    if (invoked === "workflow" && argv.includes("--run-check") && !argv.includes("--"))
      hints.push("Đặt lệnh cần chạy sau dấu --: harnix workflow --run-check <check-id> -- <exe> [args...].");
  }
  hints.push(...argumentHints(program, message));
  if (hints.length === 0) return message;
  const { message: base, hint } = splitHint(message);
  // Commander's own "Did you mean" names a sibling option of the wrong command; the owner hint replaces it.
  const kept = hint === undefined || ownerFound ? [] : [hint];
  return `${base}${HINT_MARKER}${[...hints, ...kept].join(" ")}`;
}
