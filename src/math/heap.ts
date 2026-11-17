/** Cola de prioridad binaria (mínimo). Empates se resuelven solo con el comparador. */
export class MinHeap<T> {
  private items: T[] = [];
  private less: (a: T, b: T) => boolean;

  constructor(less: (a: T, b: T) => boolean) {
    this.less = less;
  }

  get size(): number {
    return this.items.length;
  }

  push(value: T): void {
    this.items.push(value);
    this.siftUp(this.items.length - 1);
  }

  pop(): T | undefined {
    const root = this.items[0];
    const last = this.items.pop();
    if (root === undefined || last === undefined) {
      return root;
    }
    if (this.items.length === 0) {
      return root;
    }
    this.items[0] = last;
    this.siftDown(0);
    return root;
  }

  private siftUp(index: number): void {
    let cursor = index;
    while (cursor > 0) {
      const parent = Math.floor((cursor - 1) / 2);
      const current = this.items[cursor];
      const above = this.items[parent];
      if (current === undefined || above === undefined || !this.less(current, above)) {
        return;
      }
      this.items[parent] = current;
      this.items[cursor] = above;
      cursor = parent;
    }
  }

  private siftDown(index: number): void {
    let cursor = index;
    const length = this.items.length;
    while (true) {
      const left = cursor * 2 + 1;
      const right = left + 1;
      let smallest = cursor;
      const current = this.items[smallest];
      const leftItem = this.items[left];
      const rightItem = this.items[right];
      if (
        left < length &&
        current !== undefined &&
        leftItem !== undefined &&
        this.less(leftItem, current)
      ) {
        smallest = left;
      }
      const best = this.items[smallest];
      if (
        right < length &&
        best !== undefined &&
        rightItem !== undefined &&
        this.less(rightItem, best)
      ) {
        smallest = right;
      }
      if (smallest === cursor) {
        return;
      }
      const next = this.items[smallest];
      const here = this.items[cursor];
      if (next === undefined || here === undefined) {
        return;
      }
      this.items[cursor] = next;
      this.items[smallest] = here;
      cursor = smallest;
    }
  }
}
