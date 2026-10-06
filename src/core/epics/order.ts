const TASK_ID = /^\d{8}-\d{6}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;

/** An epic `order`: distinct task ids. Membership is checked where the members are known, not in the record. */
export function validateEpicOrder(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string"))
    throw new Error("Epic order must be an array of task ids.");
  const ids = value;
  for (const id of ids) if (!TASK_ID.test(id)) throw new Error(`Epic order entry ${id} is not a task id.`);
  const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);
  if (duplicate !== undefined) throw new Error(`Epic order lists ${duplicate} more than once (duplicate).`);
  return ids;
}

/** Ordered members first in the declared order, then the rest in their existing (id) order; unknown ids are ignored. */
export function orderEpicMembers<T extends { id: string }>(
  members: readonly T[],
  order: readonly string[] | undefined,
): T[] {
  if (order === undefined || order.length === 0) return [...members];
  const rank = new Map(order.map((id, index) => [id, index]));
  const listed = members.filter((member) => rank.has(member.id));
  listed.sort((left, right) => (rank.get(left.id) ?? 0) - (rank.get(right.id) ?? 0));
  return [...listed, ...members.filter((member) => !rank.has(member.id))];
}
