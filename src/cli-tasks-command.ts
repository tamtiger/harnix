import type { Command } from "commander";

import { parseStaleDays, parseTaskLimit, parseTaskStatus } from "./cli-helpers.js";
import { listProjectTasks } from "./commands/tasks.js";

export function registerTasksCommand(program: Command): void {
  program
    .command("tasks")
    .description("List bounded Harnix task metadata")
    .option("--limit <count>", "Maximum task records (1-100, default 20)")
    .option(
      "--status <status>",
      "Filter by exact task status (planning, ready, in_progress, verifying, blocked, completed, cancelled)",
    )
    .option("--archived", "List the read-only archive instead of the live tasks")
    .option("--stale", "Only planning or ready tasks idle for more than --days days")
    .option("--days <count>", "Idle days for --stale (1..3650, default 14)")
    .option("--brief", "Print only id, status, checkpoint and updatedAt of each task")
    .action(
      async (options: {
        limit?: string;
        status?: string;
        archived?: boolean;
        stale?: boolean;
        days?: string;
        brief?: boolean;
      }) => {
        if (options.days !== undefined && options.stale !== true) throw new Error("--days requires --stale for tasks.");
        const status = parseTaskStatus(options.status);
        const result = await listProjectTasks(process.cwd(), {
          limit: parseTaskLimit(options.limit ?? "20"),
          ...(status === undefined ? {} : { status }),
          ...(options.archived === true ? { archived: true } : {}),
          ...(options.stale === true ? { stale: { days: parseStaleDays(options.days ?? "14") } } : {}),
          ...(options.brief === true ? { brief: true } : {}),
        });
        process.stdout.write(`${JSON.stringify(result)}\n`);
      },
    );
}
