import { type MessageType, type Severity } from '~/model/enums';

export type Message = {
  author?: string;
  body: string;
  date: number;
  id: number;
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
