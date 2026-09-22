import type { MessageType, Severity } from '~/model/enums';
import type { Identifier } from '~/utils/collections';

export type Message = {
  author?: string;
  body: string;
  date: number;
  id: Identifier;
  message?: string;
  percentage?: number;
  raw?: boolean;
  recipient?: string;
  responseId?: Message['id'];
  severity?: Severity;
  status?: unknown; // TODO: Is this field even used anywhere?
  suspended?: boolean;
  type: MessageType;
};
