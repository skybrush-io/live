import { useTheme } from '@mui/material/styles';
import { isThemeDark } from '@skybrush/app-theme-mui';
import type { ChartOptions, ChartTypeRegistry } from 'chart.js';
import { useMemo } from 'react';
import { getDefaultChartOptions, mergeChartOptions } from './utils';

export function useChartOptions<T extends keyof ChartTypeRegistry>(
  overrides:
    | Partial<ChartOptions<T>>
    | ((isDark: boolean) => Partial<ChartOptions<T>>) = {}
): ChartOptions<T> {
  const theme = useTheme();
  const isDark = isThemeDark(theme);
  const chartOptions = useMemo(() => {
    const baseOptions = getDefaultChartOptions(isDark);
    return mergeChartOptions(
      baseOptions,
      typeof overrides === 'function' ? overrides(isDark) : overrides
    ) as ChartOptions<T>;
  }, [isDark, overrides]);
  return chartOptions;
}
