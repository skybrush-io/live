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

/**
 * Per-UAV outcome of an upload job.
 *
 * `'success'` carries the job-specific result piece; `'error'` carries the
 * failure message; `'outdated'` marks a UAV whose stored result (if any) is
 * no longer valid.
 */
export type PerUAVJobResult<ResultPiece = unknown> =
  | { type: 'success'; result: ResultPiece }
  | { type: 'error'; error: string }
  | { type: 'outdated' };

export type UAVStatus = Exclude<PerUAVJobResult['type'], 'outdated'>;

export type UploadJobResult = UAVStatus | 'cancelled';

/**
 * Aggregated upload status for a job type.
 */
export type UploadStatus = UAVStatus | 'partial' | 'not-available';

export type HistoryItem<ResultPiece = unknown> = {
  result: UploadJobResult;
  perUAVResults: Record<Identifier, PerUAVJobResult<ResultPiece>>;
};
