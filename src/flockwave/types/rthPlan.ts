export type Response_XSHOWCRTHPLAN = {
  type: 'X-SHOW-CRTH-PLAN';
  reason?: string;
  [k: string]: unknown;
};

export type CollectiveRTHConfig = {
  min_distance?: number;
  time_resolution?: number;
  velocity_xy?: number;
  velocity_z?: number;
};
