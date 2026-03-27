import type { Identifier } from '~/utils/collections';
import type { Nullable } from '~/utils/types';

export type JobPayload = unknown;

export type JobData = {
  /**
   * The type of the job.
   */
  type?: Nullable<string>;

  /**
   * The payload of the job.
   */
  payload?: JobPayload;
};

export type UAVStatus = 'success' | 'error';

export type UploadJobResult = UAVStatus | 'cancelled';

type ErrorMessage = string;

export type HistoryItem = {
  result: UploadJobResult;
  perUavStatuses: Record<Identifier, UAVStatus>;
  perUavErrors: Record<Identifier, ErrorMessage>;
};
