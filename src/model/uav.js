/**
 * @file Classes, functions and constants related to the representation of
 * an UAV.
 */

/**
 * Representation of a single UAV.
 */
export class UAV {

  /**
   * Constructor.
   *
   * Creates a new UAV with no known position.
   *
   * @param {string} id  the ID of the UAV
   */
  constructor (id) {
    this.id = id
    this.latitude = undefined
    this.longitude = undefined
  }

}
