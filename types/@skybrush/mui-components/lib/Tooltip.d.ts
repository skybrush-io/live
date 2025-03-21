import type * as React from 'react';
import { type TippyProps } from '@tippyjs/react';

export type TooltipProps = TippyProps;

/**
 * Tooltip component that adapts its appearance to the current Material UI
 * theme, depending on whether the theme is dark or light.
 */
declare const Tooltip: (props: TooltipProps) => React.JSX.Element;
export default Tooltip;
