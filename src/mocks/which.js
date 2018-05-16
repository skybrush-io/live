/**
 * @file Mock of <code>which</code> for the browser where searching for files
 * on the local filesystem is not possible.
 */

function which (...args) {
  const callback = args[args.length - 1]
  callback(new Error('Not supported in the browser'))
}

which.isMock = true

export default which
