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

export type UploadJob = {
  id: Identifier;
  payload: JobPayload;
  result: 'success' | 'error' | 'cancelled';
};
