import type {
  ErrorMap,
  MessageID,
  ReceiptMap,
  Version,
} from '@skybrush/flockwave-spec';

/**
 * Type specification for a generic Flockwave message body. For these messages,
 * all that we know is that they have a type field.
 */
export type Body = {
  type: string;
};

/**
 * Type specification for a Flockwave message where the type of the body is
 * known.
 */
export type Message<T = Body> = {
  '$fw.version': Version;
  id: MessageID;
  refs?: MessageID;
  body: T;
  [k: string]: unknown;
};

/**
 * Type specification for a generic response to an operation that may be
 * synchronous (and returns the results immediately) or asynchronous (returning
 * receipts instead of the actual responses).
 */
export type MultiAsyncOperationResponseBody<T> = Body & {
  receipt?: ReceiptMap;
  error?: ErrorMap;
  result?: Record<string, T>;
};
