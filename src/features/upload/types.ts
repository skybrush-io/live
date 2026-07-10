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

/**
 * Value object describing the progress of a job on a single UAV.
 */
export type UAVProgressInfo = {
  /**
   * The identiifer of the UAV.
   */
  uavId: Identifier;

  /**
   * The progress of the job, as a fraction between 0 and 1.
   */
  progress: number;
};

export type UAVStatus = 'success' | 'error';

export type MaybeOutdateUAVStatus = UAVStatus | 'outdated';

export type UploadJobResult = UAVStatus | 'cancelled';

/**
 * Aggregated upload status for a job type.
 */
export type UploadStatus = UAVStatus | 'partial' | 'not-available';

type ErrorMessage = string;

export type HistoryItem = {
  result: UploadJobResult;
  perUavStatuses: Record<Identifier, MaybeOutdateUAVStatus>;
  perUavErrors: Record<Identifier, ErrorMessage>;
};
