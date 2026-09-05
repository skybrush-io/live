import { createSecondaryAreaStyle, makeStyles } from '@skybrush/app-theme-mui';
import type { Cue, ShowSegment, ShowSegmentId } from '@skybrush/show-format';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  type CartesianScaleOptions,
  type ChartData,
  type ChartDataset,
  type ChartOptions,
  type TooltipItem,
} from 'chart.js';
import merge from 'deepmerge';
import type { TFunction } from 'i18next';
import { Line as LineChart } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import type { PartialDeep } from 'type-fest';

import ChartContainer from '~/components/charts/ChartContainer';
import { useChartOptions } from '~/components/charts/hooks';
import { getDefaultCartesianScaleOptions } from '~/components/charts/utils';
import {
  getShowCues,
  selectCollectiveRTHPlanTimestamps,
} from '~/features/show/selectors';
import type { RootState } from '~/store/reducers';
import { formatDuration } from '~/utils/formatting';

import { resolveColorIndex } from '~/components/charts/palette';
import {
  convertCueToChartItem,
  convertShowSegmentToChartItems,
  convertTimestampToRTHPlanItem,
  describeMarkerLane,
  describeShowSegmentId,
} from './model';
import {
  getRelevantShowSegmentsSortedByStartTime,
  getShowTimelineAltitudeRange,
  getShowTimelineDistanceFromHomeRange,
  getShowTimelineRTHDurations,
  getShowTimelineTimestamps,
} from './selectors';
import {
  isLabeledChartItem,
  isShowSegmentItem,
  isUnitHinted,
  type DatasetConfig,
  type MarkerLane,
  type MarkerLaneConfig,
  type TimelineChartConfig,
  type TimeSeriesChartItem,
  type UnitHinted,
} from './types';

ChartJS.register(
  BarElement,
  CategoryScale,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
);

const useStyles = makeStyles((theme) => ({
  root: {
    ...createSecondaryAreaStyle(theme, { inset: true }),
    flex: 1,
  },
}));

type TimelineChart = ChartJS<'line'>;
type TimelineChartData = ChartData<'line'>;
type TimelineChartOptions = ChartOptions<'line'>;

const createMarkerAxisOptions = (
  labels: string[],
  position: 'left' | 'right',
  labelFormatter?: (label: string | number) => string
) => {
  const tickConfig: {
    autoSkip: boolean;
    callback?: (label: string | number) => string;
  } = {
    // Make sure that all labels are shown
    autoSkip: false,
  };

  if (labelFormatter) {
    tickConfig.callback = labelFormatter;
  }

  return {
    type: 'category',
    labels,
    position,
    stack: 'main',

    // Set base weight of marker axis so value axes can be scaled relative to it
    stackWeight: 1,

    // Make the axis separate from the main axis on the same side
    offset: true,

    // Hide grid lines
    grid: {
      drawOnChartArea: false,
    },

    ticks: tickConfig,
  } as const;
};

type TimelineChartInputData = {
  configuration?: TimelineChartConfig;
  timestamps?: number[];
  datasets?: {
    altitudes?: [number[], number[]];
    distancesFromHome?: [number[], number[]];
    rthDurations?: number[];
  };
  markers?: {
    cues?: Cue[];
    rthPlanTimestamps?: number[];
    segments?: Array<[ShowSegmentId, ShowSegment]>;
  };
};

const DEFAULT_DATASET_OPTIONS = {
  line: {
    pointStyle: false,
  },
} as const;

const createXScaleOptions = (maxValue: number) =>
  ({
    type: 'linear',
    ticks: {
      callback: (value: number | string) =>
        typeof value === 'number' ? formatDuration(value) : value,
    },
    min: 0,
    max: maxValue,
  }) as const;

const Y_SCALE_OPTIONS = {
  type: 'linear',
  position: 'left',
  stack: 'main',
  stackWeight: 5,
  weight: 20,
} as const;

const createPluginOptions = (t: TFunction) =>
  ({
    tooltip: {
      callbacks: {
        title: (items: Array<TooltipItem<'line'>>) =>
          formatDuration(items.at(0)?.parsed.x ?? undefined),
        label: (item: TooltipItem<'line'>) => {
          const { dataset, parsed: parsedItem, raw: rawItem } = item;
          const datasetLabel = dataset.label ?? '';
          const value = parsedItem.y;

          if (isLabeledChartItem(rawItem)) {
            return rawItem.label;
          }

          if (typeof value === 'number') {
            const unit = isUnitHinted(dataset) ? dataset.unitHint : '';
            const { formattedValue } = item;
            return datasetLabel
              ? t('timeline.chart.tooltip.labeledValue', {
                  label: datasetLabel,
                  unit,
                  value: formattedValue,
                })
              : `${formattedValue}${unit}`;
          }
        },
      },
      position: 'nearest',
    },
  }) as const;

const createChartOptionsProviderFromInput = (
  input: TimelineChartInputData,
  t: TFunction
) => {
  const needsRightAxis = true;

  const scaleFunc = (
    isDark: boolean
  ): Record<string, PartialDeep<CartesianScaleOptions>> => {
    const { markers } = input;
    const scales: Record<string, PartialDeep<CartesianScaleOptions>> = {
      x: createXScaleOptions(input.timestamps?.at(-1) ?? 10),
      y: Y_SCALE_OPTIONS,
    };

    const markerLanes: MarkerLane[] = [];
    if (markers?.cues) {
      markerLanes.push('cue');
    }
    if (markers?.segments) {
      markerLanes.push('segment');
    }
    if (markers?.rthPlanTimestamps) {
      markerLanes.push('rthPlan');
    }

    const hasMarkerLanes = markerLanes.length > 0;

    if (hasMarkerLanes) {
      scales.yMarkers = {
        ...merge(
          getDefaultCartesianScaleOptions('y', isDark),
          createMarkerAxisOptions(
            [...markerLanes, ''],
            'left',
            (value: string | number) => {
              const lane =
                typeof value === 'number' && value >= 0
                  ? markerLanes.at(value)
                  : undefined;
              return lane ? describeMarkerLane(lane)(t) : '';
            }
          )
        ),

        // Make sure that the axis is placed above the left Y axis
        weight: 30,
      };
    }

    if (needsRightAxis) {
      scales.y2 = {
        ...Y_SCALE_OPTIONS,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      } as const;

      if (hasMarkerLanes) {
        // dummy scale on the right side to ensure alignment of the scales on both sides
        scales.y2Markers = {
          ...getDefaultCartesianScaleOptions('y', isDark),
          ...createMarkerAxisOptions(
            [...markerLanes.map(() => ''), ''],
            'right'
          ),

          // Make sure that the axis is placed above the right Y axis
          weight: 10,
        };
      }
    }

    return scales;
  };

  return (isDark: boolean): TimelineChartOptions => ({
    animation: false,
    datasets: DEFAULT_DATASET_OPTIONS,
    scales: scaleFunc(isDark),
    interaction: {
      intersect: false,

      // We can't use mode = index here because the "cues", "segments" and "RTH plans"
      // datasets use different indices.
      mode: 'nearest',
      axis: 'x',
    },
    plugins: createPluginOptions(t),
  });
};

const createDatasetForLane = (
  lane: MarkerLane,
  t: TFunction,
  options: ChartDataset<'line'>
): ChartDataset<'line'> => ({
  type: 'line' as const,
  label: describeMarkerLane(lane)(t),
  pointRadius: 6,
  pointHoverRadius: 6,
  pointBorderWidth: 0,
  pointHoverBorderWidth: 0,
  yAxisID: 'yMarkers',
  showLine: false,
  ...options,
});

const createTimeSeriesItems = (
  timestamps: number[],
  values: number[]
): TimeSeriesChartItem[] => {
  return timestamps.map((timestamp, index) => ({
    x: timestamp,
    y: values[index],
  }));
};

const createDatasetForTimeSeries = (
  colorIndex: number,
  timestamps: number[],
  values: number[],
  options: Omit<ChartDataset<'line'>, 'data'> & Partial<UnitHinted>
): ChartDataset<'line'> => ({
  type: 'line',
  borderColor: resolveColorIndex(colorIndex)?.color,
  backgroundColor: resolveColorIndex(colorIndex)?.areaColor,
  data: createTimeSeriesItems(timestamps, values),
  ...options,
});

const createDatasetsForTimeSeriesPair = (
  colorIndex: number,
  timestamps: number[],
  values: [number[], number[]],
  minOptions: Omit<ChartDataset<'line'>, 'data'> & Partial<UnitHinted>,
  maxOptions?: Omit<ChartDataset<'line'>, 'data'> & Partial<UnitHinted>
) => {
  return [
    createDatasetForTimeSeries(colorIndex, timestamps, values[0], {
      ...minOptions,
      borderWidth: 1,
    }),
    createDatasetForTimeSeries(colorIndex, timestamps, values[1], {
      ...(maxOptions === undefined ? minOptions : maxOptions),
      fill: '-1',
      borderWidth: 1,
    }),
  ];
};

class ChartBuilder {
  private datasets: Array<ChartDataset<'line'>> = [];

  constructor(
    private inputData: TimelineChartInputData,
    private t: TFunction
  ) {}

  public extendWithDatasets(datasetConfigs: DatasetConfig[]): void {
    const { timestamps, datasets } = this.inputData;
    if (!timestamps || !datasets) {
      return;
    }

    const { altitudes, distancesFromHome, rthDurations } = datasets;

    for (const datasetConfig of datasetConfigs) {
      const { type, axis, colorIndex } = datasetConfig;
      let toAdd: Array<ChartDataset<'line'>> = [];

      switch (type) {
        case 'altitude':
          if (altitudes) {
            toAdd = createDatasetsForTimeSeriesPair(
              colorIndex,
              timestamps,
              altitudes,
              {
                label: this.t('timeline.dataset.minAltitude'),
                unitHint: 'm',
              },
              {
                label: this.t('timeline.dataset.maxAltitude'),
                unitHint: 'm',
              }
            );
          }
          break;

        case 'distanceFromHome':
          if (distancesFromHome) {
            toAdd = createDatasetsForTimeSeriesPair(
              colorIndex,
              timestamps,
              distancesFromHome,
              {
                label: this.t('timeline.dataset.minDistance'),
                unitHint: 'm',
              },
              {
                label: this.t('timeline.dataset.maxDistance'),
                unitHint: 'm',
              }
            );
          }
          break;

        case 'rthDuration':
          if (rthDurations) {
            toAdd = [
              createDatasetForTimeSeries(colorIndex, timestamps, rthDurations, {
                label: this.t('timeline.dataset.rthDurationLine'),
                unitHint: 's',
              }),
            ];
          }
          break;
      }

      if (toAdd.length > 0) {
        for (const item of toAdd) {
          this.datasets.push({ ...item, yAxisID: axis });
        }
      }
    }
  }

  public extendWithMarkers(markerLanes: MarkerLaneConfig[]): void {
    const { cues, segments, rthPlanTimestamps } = this.inputData.markers ?? {};

    for (const laneConfig of markerLanes) {
      const { type, colorIndex } = laneConfig;
      switch (type) {
        case 'cue':
          if (cues) {
            this.extendWithCues(cues, colorIndex);
          }
          break;

        case 'segment':
          if (segments) {
            this.extendWithSegments(segments, colorIndex);
          }
          break;

        case 'rthPlan':
          if (rthPlanTimestamps) {
            this.extendWithRTHPlans(rthPlanTimestamps, colorIndex);
          }
          break;
      }
    }
  }

  extendWithCues(cues: Cue[], colorIndex: number): void {
    const color = resolveColorIndex(colorIndex)?.color ?? 'black';
    this.datasets.push(
      createDatasetForLane('cue', this.t, {
        data: cues?.map(convertCueToChartItem) as any,
        borderColor: color,
        backgroundColor: color,
        pointStyle: 'circle',
      })
    );
  }

  extendWithSegments(
    segments: Array<[ShowSegmentId, ShowSegment]>,
    colorIndex: number
  ): void {
    const color = resolveColorIndex(colorIndex)?.color ?? 'black';
    for (const [segmentId, segment] of segments) {
      this.datasets.push(
        createDatasetForLane('segment', this.t, {
          label: describeShowSegmentId(segmentId)(this.t),
          data: convertShowSegmentToChartItems(
            segment,
            segmentId,
            this.t
          ) as any,
          borderColor: color,
          borderWidth: 2,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 2,
          backgroundColor: color,
          pointStyle: 'triangle',
          pointRotation: (item) => {
            const { raw } = item;
            if (isShowSegmentItem(raw)) {
              return raw.type === 'start' ? 90 : 270;
            } else {
              return 0;
            }
          },
          showLine: true,
        })
      );
    }
  }

  extendWithRTHPlans(rthPlanTimestamps: number[], colorIndex: number): void {
    const color = resolveColorIndex(colorIndex)?.color ?? 'black';
    this.datasets.push(
      createDatasetForLane('rthPlan', this.t, {
        data: rthPlanTimestamps?.map((timestamp, index) =>
          convertTimestampToRTHPlanItem(timestamp, index, this.t)
        ) as any,
        borderColor: color,
        backgroundColor: color,
        pointStyle: 'rect',
      })
    );
  }

  public finalize(): Array<ChartDataset<'line'>> {
    return this.datasets;
  }
}

const createChartDataFromInput = (
  inputData: TimelineChartInputData,
  t: TFunction
): TimelineChartData => {
  const { configuration } = inputData;
  const { datasets = [], markerLanes = [] } = configuration ?? {};
  const builder = new ChartBuilder(inputData, t);
  builder.extendWithDatasets(datasets);
  builder.extendWithMarkers(markerLanes);
  return { datasets: builder.finalize() };
};

type OwnProps = TimelineChartConfig;
type StateProps = TimelineChartInputData;

const TimelineChart = (props: StateProps) => {
  const { t } = useTranslation();
  const chartData = createChartDataFromInput(props, t);
  const chartOptionsProvider = createChartOptionsProviderFromInput(props, t);
  const chartOptions: TimelineChartOptions =
    useChartOptions(chartOptionsProvider);

  const classes = useStyles();
  return (
    <ChartContainer className={classes.root} sx={{ p: 2 }}>
      <LineChart data={chartData} options={chartOptions} />
    </ChartContainer>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState, ownProps: OwnProps): StateProps => {
    const { datasets = [], markerLanes = [] } = ownProps;
    const timestamps = getShowTimelineTimestamps(state);
    const cues = getShowCues(state);
    const segments = getRelevantShowSegmentsSortedByStartTime(state);
    const rthPlanTimestamps = selectCollectiveRTHPlanTimestamps(state);
    const allDatasetTypes = datasets.map((d) => d.type);
    const allMarkerLaneTypes = markerLanes.map((m) => m.type);

    const needDistances = allDatasetTypes.includes('distanceFromHome');
    const needAltitudes = allDatasetTypes.includes('altitude');
    const needRthDurations = allDatasetTypes.includes('rthDuration');

    const altitudes = needAltitudes
      ? getShowTimelineAltitudeRange(state)
      : undefined;
    const distancesFromHome = needDistances
      ? getShowTimelineDistanceFromHomeRange(state)
      : undefined;
    const rthDurations = needRthDurations
      ? getShowTimelineRTHDurations(state)
      : undefined;

    const showCues = allMarkerLaneTypes.includes('cue');
    const showSegments = allMarkerLaneTypes.includes('segment');
    const showRthPlanTimestamps = allMarkerLaneTypes.includes('rthPlan');

    return {
      configuration: ownProps,
      timestamps,
      datasets: {
        altitudes,
        distancesFromHome,
        rthDurations,
      },
      markers: {
        cues: showCues ? cues : undefined,
        segments: showSegments ? segments : undefined,
        rthPlanTimestamps: showRthPlanTimestamps
          ? rthPlanTimestamps
          : undefined,
      },
    };
  },
  // mapDispatchToProps
  {}
)(TimelineChart);
