import type { TFunction } from 'i18next';
import type { Cue, ShowSegment, ShowSegmentId } from '@skybrush/show-format';
import { produce } from 'immer';
import { tt, type PreparedI18nKey } from '~/i18n';
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

export function describeMarkerLane(lane: MarkerLane): PreparedI18nKey {
  switch (lane) {
    case 'cue':
      return tt('timeline.markerLane.cue');
    case 'rthPlan':
      return tt('timeline.markerLane.rthPlan');
    case 'segment':
      return tt('timeline.markerLane.segment');
    default:
      return tt('timeline.markerLane.unknown', { lane: String(lane) });
  }
}

export function describeShowSegmentId(type: ShowSegmentId): PreparedI18nKey {
  switch (type) {
    case 'takeoff':
      return tt('timeline.showSegment.takeoff');
    case 'landing':
      return tt('timeline.showSegment.landing');
    case 'show':
      return tt('timeline.showSegment.show');
    default:
      return tt('timeline.showSegment.unknown', { type: String(type) });
  }
}

export function convertShowSegmentToChartItems(
  segment: ShowSegment,
  type: ShowSegmentId,
  t: TFunction
): ShowSegmentItem[] {
  const description = describeShowSegmentId(type)(t);
  return segment.map((item, index) => ({
    x: item,
    y: 'segment',
    label:
      index === 0
        ? t('timeline.showSegment.startOf', { description })
        : index === 1
          ? t('timeline.showSegment.endOf', { description })
          : description,
    type: index === 0 ? 'start' : 'end',
  }));
}

export function convertTimestampToRTHPlanItem(
  timestamp: number,
  index: number,
  t: TFunction
): RTHPlanChartItem {
  return {
    x: timestamp,
    y: 'rthPlan',
    label: t('timeline.rthPlanItem', { index: index + 1 }),
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
