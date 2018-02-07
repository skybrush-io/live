/**
 * @file Mock of <code>node-ssdp-lite</code> for the browser where no
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

Client.isMock = true
