import type { Cue, ShowSegment, ShowSegmentId } from '@skybrush/show-format';
import { produce } from 'immer';
import { findNextAvailableIndex } from '~/utils/naming';
import type {
  CueChartItem,
  Dataset,
  MarkerLane,
  RTHPlanChartItem,
  ShowSegmentItem,
  TImelineChartAxis,
  TimelineChartConfig,
} from './types';

export const EMPTY_CHART: Readonly<TimelineChartConfig> = Object.freeze({
  datasets: [],
  markerLanes: [],
});

export function convertCueToChartItem(cue: Cue): CueChartItem {
  return {
    x: cue.time,
    y: 'cue',
    label: cue.name,
  };
}

export function describeMarkerLane(lane: MarkerLane): string {
  // TODO(ntamas): allow localization!
  switch (lane) {
    case 'cue':
      return 'Cues';
    case 'rthPlan':
      return 'RTH plans';
    case 'segment':
      return 'Segments';
    default:
      return `Unknown lane (${JSON.stringify(lane)})`;
  }
}

export function describeShowSegmentId(type: ShowSegmentId) {
  // TODO(ntamas): allow localization!
  switch (type) {
    case 'takeoff':
      return 'takeoff';
    case 'landing':
      return 'landing';
    case 'show':
      return 'net show';
    default:
      return `show segment ${JSON.stringify(type)}`;
  }
}

export function convertShowSegmentToChartItems(
  segment: ShowSegment,
  type: ShowSegmentId
): ShowSegmentItem[] {
  // TODO(ntamas): allow localization!
  const description = describeShowSegmentId(type);
  return segment.map((item, index) => ({
    x: item,
    y: 'segment',
    label:
      index === 0
        ? `Start of ${description}`
        : index === 1
          ? `End of ${description}`
          : description,
    type: index === 0 ? 'start' : 'end',
  }));
}

export function convertTimestampToRTHPlanItem(
  timestamp: number,
  index: number
): RTHPlanChartItem {
  // TODO(ntamas): allow localization!
  return {
    x: timestamp,
    y: 'rthPlan',
    label: `RTH plan ${index + 1}`,
  };
}

/**
 * Toggles the visibility of the given marker lane on the timeline chart.
 *
 * When the marker lane is added, the next available color is assigned to it. Colors are
 * unique across the entire configuration.
 */
export const toggleMarkerLane = (
  config: TimelineChartConfig,
  lane: MarkerLane
): TimelineChartConfig =>
  produce(config, (draft) => {
    const { markerLanes } = draft;
    const existingIndex = markerLanes.findIndex((l) => l.type === lane);
    if (existingIndex >= 0) {
      // Remove the marker lane
      markerLanes.splice(existingIndex, 1);
    } else {
      // Add the marker lane with the next available color index
      markerLanes.push({
        type: lane,
        colorIndex: findNextAvailableIndex(markerLanes, (l) => l.colorIndex),
      });
    }
  });

/**
 * Toggles the dataset on the given axis of the timeline chart.
 *
 * Each dataset can be shown on either the left or right axis of the chart. This
 * function adds or removes the dataset from the axis configuration, depending on
 * whether it is already present on the given axis or not. When the dataset is added,
 * the next available color is assigned to it. Colors are unique across the entire
 * configuration.
 *
 * @param config - the timeline chart configuration to modify
 * @param dataset - the dataset to toggle
 * @param axis - the axis to toggle the dataset on
 * @returns a new timeline chart configuration with the dataset toggled on the given axis
 */
export const toggleDatasetOnAxis = (
  config: TimelineChartConfig,
  dataset: Dataset,
  axis: TImelineChartAxis
) =>
  produce(config, (draft) => {
    const { datasets } = draft;
    const existingIndex = datasets.findIndex((d) => d.type === dataset);

    if (existingIndex >= 0) {
      if (datasets[existingIndex].axis === axis) {
        // Remove the dataset from the axis
        datasets.splice(existingIndex, 1);
      } else {
        // Move the dataset to this axis, keeping the color
        datasets[existingIndex].axis = axis;
      }
    } else {
      // Add the dataset to the axis with the next available color index
      datasets.push({
        axis,
        type: dataset,
        colorIndex: findNextAvailableIndex(datasets, (d) => d.colorIndex),
      });
    }
  });
