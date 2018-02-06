/**
 * @file Mock of <code>domotz-node-ssdp</code> for the browser where no
 * SSDP autodetection is possible.
 */

export default class Client {
  on () {
    // Nop.
  }

  search () {
    // Nop.
  }
}
