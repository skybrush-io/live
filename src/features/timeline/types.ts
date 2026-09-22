/**
 * Type alias matching the names of the axes used on the timeline chart.
 */
export type TImelineChartAxis = 'y' | 'y2';

/**
 * Type alias matching the names of the datasets that we can place on the left or right
 * axis of the timeline chart.
 */
export type Dataset = 'altitude' | 'distanceFromHome' | 'rthDuration';

/**
 * Configuration of a single dataset to show on the timeline chart. Specifies the
 * dataset itself, the axis on which the dataset should be shown and its color.
 */
export type DatasetConfig = {
  /// The type of the dataset to show on the timeline chart.
  type: Dataset;

  /// The axis on which the dataset should be shown.
  axis: TImelineChartAxis;

  /// The palette index of the color of the dataset on the timeline chart.
  colorIndex: number;
};

/**
 * Type alias matching the names of marker lanes that we use in the timeline chart.
 */
export type MarkerLane = 'cue' | 'segment' | 'rthPlan';

/**
 * Configuration of a single marker lane to show on the timeline chart. Specifies the
 * marker type itself and its color.
 */
export type MarkerLaneConfig = {
  /// The marker lane to show on the timeline chart.
  type: MarkerLane;

  /// The palette index of the color of the marker lane on the timeline chart.
  colorIndex: number;
};

/**
 * Specifies the configuration of the left or right vertical axis of the timeline chart.
 */
export type TimelineChartConfig = {
  /// The datasets that are displayed on the chart.
  datasets: DatasetConfig[];

  /// The marker lanes that are displayed on the chart.
  markerLanes: MarkerLaneConfig[];
};

/**
 * Type alias for numeric time series items
 */
export type TimeSeriesChartItem = {
  /// The time of the chart item, in seconds.
  x: number;

  /// The value of the chart item.
  y: number;
};

/**
 * Generic type for chart items that provide a label.
 */
export type LabeledChartItem<T> = {
  /// The time of the chart item, in seconds.
  x: number;

  /// The value of the chart item.
  y: T;

  /// The label of the chart item, which will be displayed in the chart tooltip.
  label: string;
};

/**
 * Chart.js chart item representing a single cue in the show.
 */
export type CueChartItem = LabeledChartItem<MarkerLane>;

/**
 * Chart.js chart item representing a single RTH plan in the show.
 */
export type RTHPlanChartItem = LabeledChartItem<MarkerLane>;

/**
 * Chart.js chart item representing the start or end of a segment in the show.
 */
export type ShowSegmentItem = LabeledChartItem<MarkerLane> & {
  type: 'start' | 'end';
};

/**
 * Returns whether the given chart item is a labeled chart item.
 *
 * @param item - the item to test
 */
export function isLabeledChartItem(
  item: any
): item is LabeledChartItem<unknown> {
  return typeof item.x === 'number' && typeof item.label === 'string';
}

/**
 * Returns whether the given chart item is a show segment chart item.
 *
 * @param item - the item to test
 */
export function isShowSegmentItem(item: any): item is ShowSegmentItem {
  return (
    (item.type === 'start' || item.type === 'end') && isLabeledChartItem(item)
  );
}

export type UnitHinted = { unitHint: string };

/**
 * Returns whether the given object provides a unit hint for a chart item or dataset.
 *
 * @param item - the item to test
 */
export function isUnitHinted(item: any): item is UnitHinted {
  return typeof item.unitHint === 'string';
}
