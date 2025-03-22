export type UAVIdAndMissionIndexPair = [string | undefined, number | undefined];
export type ExtraSlot = [undefined, undefined, string | JSX.Element];

export type GroupedUAVIds = {
  mainUAVIds: Array<[string | undefined, number | undefined]>;
  spareUAVIds: Array<[string, undefined]>;
};

export type GroupSelectionInfoEntry = {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
};

export type GroupSelectionInfo = {
  mainUAVIds: GroupSelectionInfoEntry;
  spareUAVIds: GroupSelectionInfoEntry;
};

export type Item =
  | UAVIdAndMissionIndexPair
  | [...UAVIdAndMissionIndexPair, string | JSX.Element];
