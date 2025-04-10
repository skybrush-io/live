import type * as React from 'react';
import { type StatusLightProps } from './StatusLight';
import type { TypographyProps } from '@material-ui/core/Typography';

export type LabeledStatusLightProps = StatusLightProps & {
  children: React.ReactNode;
  color?: TypographyProps['color'];
};

declare const LabeledStatusLight: ({
  children,
  color,
  size,
  status,
  ...rest
}: LabeledStatusLightProps) => React.JSX.Element;

export default LabeledStatusLight;
