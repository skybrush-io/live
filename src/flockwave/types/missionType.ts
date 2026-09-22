export type Response_XMSNTYPELIST = {
  type: 'X-MSN-TYPE-LIST';
  ids?: string[];
  [k: string]: unknown;
};

export type Response_XMSNTYPEINF = {
  type: 'X-MSN-TYPE-INF';
  items?: Record<string, unknown>;
  [k: string]: unknown;
};

export type Response_XMSNTYPESCHEMA = {
  type: 'X-MSN-TYPE-SCHEMA';
  items?: Record<string, Record<string, unknown>>;
  [k: string]: unknown;
};
