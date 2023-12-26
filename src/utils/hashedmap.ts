/**
 * @file Hashed map class based on JavaScript's built in map type
 */

/**
 * Hashed map class based on JavaScript's built in map type, but using
 * JSON stringified keys internally and thus value comparison instead of
 * reference for objects.
 *
 * @param map - The original map or an array of key-value pairs
 *              to base the object on
 */
export default class HashedMap<K, V> {
  #map: Map<string, V>;

  constructor(map: Map<K, V>) {
    if (map instanceof Map) {
      this.#map = new Map(
        [...map.entries()].map(([k, v]) => [JSON.stringify(k), v])
      );
    } else if (Array.isArray(map)) {
      this.#map = new Map(map);
    } else {
      this.#map = new Map();
    }
  }

  set(key: K, value: V): Map<string, V> {
    return this.#map.set(JSON.stringify(key), value);
  }

  has(key: K): boolean {
    return this.#map.has(JSON.stringify(key));
  }

  get(key: K): V | undefined {
    return this.#map.get(JSON.stringify(key));
  }

  get data(): Map<string, V> {
    return this.#map;
  }

  get size(): number {
    return this.#map.size;
  }

  *keys(): IterableIterator<K> {
    for (const key of this.#map.keys()) {
      yield JSON.parse(key);
    }
  }

  *[Symbol.iterator](): IterableIterator<[K, V]> {
    for (const [key, value] of this.#map) {
      yield [JSON.parse(key), value];
    }
  }
}
