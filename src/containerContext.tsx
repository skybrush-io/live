import React from 'react';

import Popover, { type PopoverProps } from '@material-ui/core/Popover';
// TODO(vp): remove ts-ignore
import Tooltip, {
  type TooltipProps, // @ts-ignore
} from '@skybrush/mui-components/lib/Tooltip';

export const ContainerContext = React.createContext(window.document.body);

export const PopoverWithContainerFromContext = React.forwardRef(
  (props: PopoverProps, ref) => (
    <ContainerContext.Consumer>
      {(container) => <Popover {...props} ref={ref} container={container} />}
    </ContainerContext.Consumer>
  )
);

export const TooltipWithContainerFromContext = React.forwardRef(
  (props: TooltipProps, ref) => (
    <ContainerContext.Consumer>
      {(container) => <Tooltip {...props} ref={ref} appendTo={container} />}
    </ContainerContext.Consumer>
  )
);
