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

/** The candidate nearest to `value`, or undefined when none is close enough to be a likely typo. */
export function closestMatch(value: string, candidates: readonly string[]): string | undefined {
  const limit = Math.max(2, Math.floor(value.length / 3));
  let best: { candidate: string; distance: number } | undefined;
  for (const candidate of candidates) {
    const distance = editDistance(value.toLowerCase(), candidate.toLowerCase());
    if (distance <= limit && (best === undefined || distance < best.distance)) best = { candidate, distance };
  }
  return best?.candidate;
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
