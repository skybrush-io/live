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
      this.map_ = map
    } else if (Array.isArray(map)) {
      this.map_ = new Map(map)
    } else {
      this.map_ = new Map()
    }
  }

  set (key, value) { return this.map_.set(JSON.stringify(key), value) }
  has (key) { return this.map_.has(JSON.stringify(key)) }
  get (key) { return this.map_.get(JSON.stringify(key)) }
  get size () { return this.map_.size }

  * keys () { for (const key of this.map_.keys()) { yield JSON.parse(key) } }

  * [Symbol.iterator] () {
    for (const [key, value] of this.map_) { yield [JSON.parse(key), value] }
  }
}
