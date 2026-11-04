import { format, resolveConfig } from "prettier";

/** The text of a golden file as the repository's Prettier writes it, so a regenerated golden shows only real changes. */
export async function formatGolden(value: unknown, filepath: string): Promise<string> {
  const options = (await resolveConfig(filepath)) ?? {};
  return format(JSON.stringify(value, null, 2), { ...options, parser: "json", filepath });
}
