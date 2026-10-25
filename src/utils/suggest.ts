const MAX_LISTED = 20;

function editDistance(left: string, right: string): number {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      const substitution = previous[column - 1]! + (left[row - 1] === right[column - 1] ? 0 : 1);
      current.push(Math.min(previous[column]! + 1, current[column - 1]! + 1, substitution));
    }
    previous = current;
  }
  return previous[right.length]!;
}

const TRAILING_NUMBER = /^(.*?)(\d+)$/u;

/** `ac-3` and `ac-1` name different things that only share a prefix: suggesting one for the other invites a wrong id. */
function onlyNumberDiffers(left: string, right: string): boolean {
  const a = TRAILING_NUMBER.exec(left);
  const b = TRAILING_NUMBER.exec(right);
  return a !== null && b !== null && a[1] === b[1] && a[2] !== b[2];
}

/**
 * The single candidate nearest to `value`, or undefined when none is close enough to be a likely typo, when two or
 * more are equally close, or when the nearest differs only in its trailing number (a sibling, not a typo).
 */
export function closestMatch(value: string, candidates: readonly string[]): string | undefined {
  if (value.trim() === "") return undefined;
  const limit = Math.max(2, Math.floor(value.length / 3));
  let best: { candidate: string; distance: number } | undefined;
  let tied = false;
  for (const candidate of candidates) {
    const distance = editDistance(value.toLowerCase(), candidate.toLowerCase());
    if (distance > limit || (best !== undefined && distance > best.distance)) continue;
    tied = best !== undefined && distance === best.distance;
    if (!tied) best = { candidate, distance };
  }
  if (best === undefined || tied || onlyNumberDiffers(value.toLowerCase(), best.candidate.toLowerCase()))
    return undefined;
  return best.candidate;
}

/**
 * An error for an id that does not exist, with a `Gợi ý:` line listing the valid ids and the nearest one, so an agent
 * that mistyped an id can retry with the right one instead of guessing.
 */
export function unknownIdError(message: string, kind: string, id: string, known: readonly string[]): Error {
  if (known.length === 0) return new Error(`${message}\nGợi ý: chưa có ${kind} nào.`);
  const listed = known.slice(0, MAX_LISTED).join(", ") + (known.length > MAX_LISTED ? ", …" : "");
  const nearest = closestMatch(id, known);
  return new Error(
    `${message}\nGợi ý: ${kind} hợp lệ: ${listed}.${nearest === undefined ? "" : ` Có phải ý bạn là ${nearest}?`}`,
  );
}
