import objectHash from 'object-hash';

/* Large result payloads of tasks (e.g. downloaded flight logs or transformed
 * show files) must not enter the Redux store. Runners store them in this
 * module-level payload store, keyed by the SHA-1 hash of their serialized
 * form, and only the hash goes into the task state. */

const payloads = new Map<string, unknown>();

/**
 * Stores the given payload in the payload store and returns its hash.
 *
 * Only the hash should be kept in the Redux store; the payload itself can be
 * retrieved later with `readTaskPayload()`.
 */
export const writeTaskPayload = (payload: string | object): string => {
  const hash = objectHash(payload);
  payloads.set(hash, payload);
  return hash;
};

/**
 * Returns the payload associated with the given hash, or `undefined` if the
 * hash is unknown (e.g. because the payload has been discarded since).
 */
export const readTaskPayload = <T>(hash: string): T | undefined =>
  // Generic typed retrieval from an untyped store; the caller asserts the
  // type that the runner of the given task has written.
  payloads.get(hash) as T | undefined;

/**
 * Discards the payload associated with the given hash.
 */
export const deleteTaskPayload = (hash: string): void => {
  payloads.delete(hash);
};
