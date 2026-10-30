/** `setCheck` becomes `--set-check`: the flag of the action that was running. */
const flagOf = (action: string): string => `--${action.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`)}`;

const REASON_ACTIONS = new Set(["setCheck", "addCriterion", "setCriterion", "replaceCheck", "batch"]);

/**
 * A runnable correction for a missing or mis-sized `--reason`, built from the flag that was actually running; undefined
 * when the error is not about `--reason` or the running action takes none.
 */
export function reasonHint(message: string, actions: readonly string[]): string | undefined {
  if (!/--reason/u.test(message) || !/characters/u.test(message)) return undefined;
  const action = actions.find((candidate) => REASON_ACTIONS.has(candidate));
  if (action === undefined) return undefined;
  const flag = flagOf(action);
  const body = action === "batch" ? `${flag} (với "reason" trong envelope)` : `${flag} ... --reason "<10-1000 ký tự>"`;
  return `Gợi ý: thêm lý do vào đúng lệnh đang chạy, ví dụ: harnix workflow ${body}, như --reason "Bổ sung check vì chưa phủ ac-2".`;
}
