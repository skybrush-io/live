import React from 'react';

import Popover, { type PopoverProps } from '@mui/material/Popover';
import { Tooltip } from '@skybrush/mui-components';
import type { TooltipProps } from '@skybrush/mui-components/lib/Tooltip';

export const ContainerContext = React.createContext(window.document.body);

export const PopoverWithContainerFromContext = React.forwardRef<
  HTMLDivElement,
  PopoverProps
>((props, ref) => (
  <ContainerContext.Consumer>
    {(container) => <Popover {...props} ref={ref} container={container} />}
  </ContainerContext.Consumer>
));

export const TooltipWithContainerFromContext = React.forwardRef<
  HTMLElement,
  TooltipProps
>((props, ref) => (
  <ContainerContext.Consumer>
    {(container) => <Tooltip {...props} ref={ref} appendTo={container} />}
  </ContainerContext.Consumer>
));
