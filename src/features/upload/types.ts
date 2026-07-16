import type { Identifier } from '~/utils/collections';

export type JobPayload = unknown;

export type JobData = {
  /**
   * The type of the job.
   */
  type?: string;

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

export type MaybeOutdatedUAVStatus = UAVStatus | 'outdated';

export type UploadJobResult = UAVStatus | 'cancelled';

/**
 * Aggregated upload status for a job type.
 */
export type UploadStatus = UAVStatus | 'partial' | 'not-available';

type ErrorMessage = string;

export type HistoryItem = {
  result: UploadJobResult;
  perUavStatuses: Record<Identifier, MaybeOutdatedUAVStatus>;
  perUavErrors: Record<Identifier, ErrorMessage>;
};

/**
 * Type describing the outcome of a long-running operation (a job or a task), with
 * distinction between temporary and permanent failures.
 */
export type Outcome<T, E = unknown> =
  | {
      type: 'success';
      result: T;
    }
  | {
      type: 'failure';
      error: E;
    }
  | {
      type: 'permanent-failure';
      error: E;
    }
  | {
      type: 'cancelled';
    };
