import type { Command } from "commander";

import { archiveProject, DEFAULT_ARCHIVE_DAYS } from "./commands/archive.js";

function parseDays(value: string): number {
  const days = Number(value);
  if (!/^\d+$/u.test(value) || days < 1 || days > 3650)
    throw new Error("--days must be an integer between 1 and 3650.");
  return days;
}

export function registerArchiveCommand(program: Command): void {
  program
    .command("archive")
    .description("Move finished tasks and epics older than --days into the read-only archive (dry run unless --apply)")
    .option("--days <count>", `Age in days since a task finished (default ${DEFAULT_ARCHIVE_DAYS})`)
    .option("--apply", "Move the listed items instead of only listing them")
    .option("--restore <id>", "Bring one archived task, or an archived epic with its members, back")
    .action(async (options: { days?: string; apply?: boolean; restore?: string }) => {
      const result = await archiveProject(process.cwd(), {
        ...(options.days === undefined ? {} : { days: parseDays(options.days) }),
        ...(options.apply === true ? { apply: true } : {}),
        ...(options.restore === undefined ? {} : { restore: options.restore }),
      });
      process.stdout.write(`${JSON.stringify(result)}\n`);
    });
}
