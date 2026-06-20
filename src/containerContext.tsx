import React from 'react';

import Popover, { type PopoverProps } from '@mui/material/Popover';
import { Tooltip, type TooltipProps } from '@skybrush/mui-components';

export const ContainerContext = React.createContext(window.document.body);

export const PopoverWithContainerFromContext = ({
  ref,
  ...props
}: PopoverProps) => (
  <ContainerContext.Consumer>
    {(container) => <Popover {...props} ref={ref} container={container} />}
  </ContainerContext.Consumer>
);

export const TooltipWithContainerFromContext = ({
  ref,
  ...props
}: TooltipProps) => (
  <ContainerContext.Consumer>
    {(container) => <Tooltip {...props} ref={ref} appendTo={container} />}
  </ContainerContext.Consumer>
);
