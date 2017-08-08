/**
 * @file Hashed map class based on JavaScript's built in map type
 */

/**
 * Hashed map class based on JavaScript's built in map type, but using
 * JSON stringified keys internally and thus value comparison instead of
 * reference for objects.
 *
 * @param {Map|Object} map the original map or an array of key-value pairs
 * to base the object on
 */
export default class HashedMap {
  constructor (map) {
    if (map instanceof Map) {
      this._map = map
    } else if (Array.isArray(map)) {
      this._map = new Map(map)
    } else {
      this._map = new Map()
    }
  }

  set (key, value) { return this._map.set(JSON.stringify(key), value) }
  has (key) { return this._map.has(JSON.stringify(key)) }
  get (key) { return this._map.get(JSON.stringify(key)) }

  get data () { return this._map }
  get size () { return this._map.size }

  * keys () { for (const key of this._map.keys()) { yield JSON.parse(key) } }

  * [Symbol.iterator] () {
    for (const [key, value] of this._map) { yield [JSON.parse(key), value] }
  }
}
