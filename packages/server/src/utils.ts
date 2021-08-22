type Iterableify<T> = {[K in keyof T]: Iterable<T[K]>};

export function* zip<T extends any[]>(...toZip: Iterableify<T>): Generator<T> {
  // Get iterators for all of the iterables.
  const iterators = toZip.map((i) => i[Symbol.iterator]());

  while (true) {
    // Advance all of the iterators.
    const results = iterators.map((i) => i.next());

    // If any of the iterators are done, we should stop.
    if (results.some(({done}) => done)) {
      break;
    }

    // We can assert the yield type, since we know none
    // of the iterators are done.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    yield results.map(({value}) => value) as T;
  }
}
