/** Month bucket (`YYYY-MM`) a new task or epic lands in; mirrors `monthBucket` so tests can name the physical path. */
export function taskMonth(id: string): string {
  return `${id.slice(0, 4)}-${id.slice(4, 6)}`;
}
