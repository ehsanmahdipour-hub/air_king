/**
 * In-place removal of dead entities. This keeps the per-step cost allocation
 * free instead of building a new filtered array every frame.
 */
export function compact<T extends { alive: boolean }>(items: T[]): void {
  let write = 0;

  for (let read = 0; read < items.length; read += 1) {
    const item = items[read];
    if (item.alive) {
      items[write] = item;
      write += 1;
    }
  }

  items.length = write;
}
