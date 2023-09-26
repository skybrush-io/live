import { type Identifier } from '~/utils/collections';

export type JobPayload = unknown;

export type UploadJob = {
  id: Identifier;
  payload: JobPayload;
  result: 'success' | 'error' | 'cancelled';
};
