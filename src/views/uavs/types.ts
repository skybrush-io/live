/**
 * Represents a pair consisting of a UAV ID and a corresponding mission index.
 *
 * The mission index is undefined if the UAV is not part of the mission. The
 * UAV ID is undefined if the entry represents an empty mission slot. At least
 * one of the two items must be defined.
 *
 * TODO: This probably doesn't need to be its own separate type.
 */
export type UAVIdAndMissionIndexPair = [
  uavId: string | undefined,
  missionIndex: number | undefined,
];

/**
 * Represents a single item in a UAV list or grid.
 *
 * The item consists of a UAV ID, a mission index, and an optional label.
 *
 * TODO: Rename this to `UAVItem`!
 */
export type Item = [
  ...UAVIdAndMissionIndexPair,
  label?: string | React.JSX.Element,
];

/**
 * Types of the UAV groups that can be shown in the UAV list or grid.
 *
 * These are primarily used to derive the label of the group on the UI such
 * that they can be localized based on the group type.
 */
export enum UAVGroupType {
  /// This group contains all UAVs managed by the system
  ALL = 'all',

  /**
   * This group contains the UAVs that are assigned to the mission. May also
   * contain empty slots if empty slots are turned on in the UI.
   */
  ASSIGNED = 'assigned',

  /**
   * This group contains the UAVs that are not assigned to any specific slot
   * in the mission.
   */
  SPARE = 'spare',
}

/**
 * A group of UAVs that are shown together in the UI.
 */
export type UAVGroup = {
  /// Unique identifier of the group
  id: string;

  /// Type of the UAV group
  type: UAVGroupType;

  /// Label of the group that will be shown on the UI. Overrides any default label
  label?: string;

  /// List of items that are part of this group. Each item is a UAV ID and a
  /// mission index. May optionally have a user-defined label.
  items: Item[];
};

/**
 * Object providing information about the current selection of UAVs in context
 * of a group. This can be used to present a selection checkbox for the group.
 */
export type GroupSelectionInfo = {
  /// True if and only if all the UAVs in the group are selected and the group
  /// is not empty
  checked: boolean;

  /// True if and only if at least one but not all the UAVs in the group are selected
  indeterminate: boolean;

  /// True if and only if the group is empty
  disabled: boolean;
};
