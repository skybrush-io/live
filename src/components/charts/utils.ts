import { defaultFont } from '@skybrush/app-theme-mui';
import type { ChartData, ChartOptions, ChartTypeRegistry } from 'chart.js';
import createColor from 'color';
import merge from 'deepmerge';

const BASE_CHART_OPTIONS: ChartOptions = {
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      titleFont: { family: defaultFont },
      bodyFont: { family: defaultFont },
      footerFont: { family: defaultFont },
    },
  },

  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          family: defaultFont,
          size: 14,
        },
      },
    },

    y: {
      ticks: {
        font: {
          family: defaultFont,
          size: 14,
        },
      },
    },
  },

  maintainAspectRatio: false,
};

export const mergeChartOptions = <T extends keyof ChartTypeRegistry>(
  baseOptions: ChartOptions<T>,
  overrideOptions: Partial<ChartOptions<T>>
): ChartOptions<T> => merge(baseOptions, overrideOptions);

/**
 * Creates default chart options for Chart.js charts, with theme-specific settings
 * based on the provided `isDark` parameter.
 *
 * @param isDark - whether the theme being targeted by the options is a dark theme
 * @returns - a Chart.js options object with theme-specific settings
 */
export const createChartOptions = <T extends keyof ChartTypeRegistry>(
  isDark: boolean
): ChartOptions<T> =>
  mergeChartOptions<T>(
    BASE_CHART_OPTIONS as ChartOptions<T>,
    {
      scales: {
        x: {
          border: {
            color: isDark ? 'rgba(255, 255, 255, 0.17)' : 'rgba(0, 0, 0, 0.17)',
          },
          ticks: {
            color: isDark ? 'rgba(255, 255, 255, 0.54)' : 'rgba(0, 0, 0, 0.54)',
          },
        },

        y: {
          border: {
            color: isDark ? 'rgba(255, 255, 255, 0.17)' : 'rgba(0, 0, 0, 0.17)',
          },
          grid: {
            color: isDark
              ? ({ index }) => `rgba(255, 255, 255, ${index ? 0.17 : 0.34})`
              : ({ index }) => `rgba(0, 0, 0, ${index ? 0.17 : 0.34})`,
          },
          ticks: {
            color: isDark ? 'rgba(255, 255, 255, 0.54)' : 'rgba(0, 0, 0, 0.54)',
          },
        },
      },
    } as ChartOptions<T>
  );

type GradientBackgroundOptions = {
  alpha?: number;
  color: string;
  canvas?: HTMLCanvasElement;
  ctx?: CanvasRenderingContext2D | null;
  height?: number;
  reverse?: boolean;
};

type BarChartStyleOptions = {
  canvas?: HTMLCanvasElement;
  color: string;
};

/**
 * Constant to use when there are no datasets in a bar chart.
 */
export const NO_BAR_CHART_DATA: ChartData<'bar'> = {
  datasets: [],
};

/**
 * Creates a standard style for a single bar chart data series in a Chart.js
 * chart.
 */
export function createBarChartStyle({ canvas, color }: BarChartStyleOptions) {
  return {
    backgroundColor: createGradientBackground({ canvas, color }),
    borderColor: color,
    borderWidth: 2,
  };
}

/**
 * Creates a gradient fill that could be used in a Chart.js background in a bar or
 * line chart.
 *
 * @param options.alpha The alpha component of the color.
 * @param options.color The color.
 * @param options.ctx The drawing context on which the gradient will be drawn.
 * @param options.height The height of the gradient.
 * @param options.reverse Whether the gradient should go from top to bottom
 *   (false) or bottom to top (true).
 * @returns The constructed gradient fill.
 */
export const createGradientBackground = (
  options: GradientBackgroundOptions
): CanvasGradient => {
  const { alpha = 0.8, color, canvas, height = 170, reverse } = options;
  let { ctx } = options;

  // For legacy react-chartjs-2 version 3.x when we passed the canvas and not
  // the context
  if (!ctx) {
    ctx = canvas?.getContext('2d') ?? null;
  }

  if (!ctx) {
    throw new Error('Canvas rendering context is required.');
  }

  const gradientFill = ctx.createLinearGradient(0, height, 0, 50);
  gradientFill.addColorStop(
    0,
    createColor(color)
      .alpha(reverse ? alpha : 0)
      .string()
  );
  gradientFill.addColorStop(
    1,
    createColor(color)
      .alpha(reverse ? 0 : alpha)
      .string()
  );

  return gradientFill;
};
