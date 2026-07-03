import type {
  Response_AUTHRESP_MultiStep,
  Response_AUTHRESP_SingleStep,
} from '@skybrush/flockwave-spec';

import type MessageHub from '~/flockwave/messages';
import { type Identifier } from '~/utils/collections';

export enum Protocol {
  TCP = 'tcp',
  WS = 'ws',
}

export type ServerAuthenticationInformation = {
  methods: string[];
  required: boolean;
  user: string;
  valid: boolean;
};

export type ServerParameters = {
  id: Identifier;
  hostName: string;
  label: string;
  port: number;
  protocol: string; // Not the same as `Protocol` in `server-settings-dialog`!
  type: 'detected' | 'inferred';
};

export type AuthResponseBody =
  | Response_AUTHRESP_SingleStep
  | Response_AUTHRESP_MultiStep
  | { type: string; reason?: unknown };

export type AuthenticationResult = {
  result: boolean;
  user?: string;
  reason?: string;
};

export type AuthenticateParams = {
  method: string;
  data: string;
  messageHub: MessageHub;
};

export enum ServerSettingsDialogTab {
  AUTO = 'auto',
  MANUAL = 'manual',
}
