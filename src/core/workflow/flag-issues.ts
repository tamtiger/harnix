/**
 * One error for every problem found in a single call, so a caller fixes them all in one round trip: a lone problem
 * keeps its own text, several are listed, and both end with the corrected command.
 */
export function flagIssueError(command: string, issues: readonly string[], example: string): Error {
  const body =
    issues.length === 1
      ? (issues[0] ?? "")
      : `${command} has ${issues.length} problems:\n${issues.map((issue) => `- ${issue}`).join("\n")}`;
  return new Error(`${body}\nGợi ý: lệnh mẫu: ${example}`);
}
