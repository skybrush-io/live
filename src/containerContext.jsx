import React from 'react';

import Popover from '@material-ui/core/Popover';
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

export const ContainerContext = React.createContext(window.document.body);

export const PopoverWithContainerFromContext = React.forwardRef(
  (props, ref) => (
    <ContainerContext.Consumer>
      {(container) => <Popover {...props} ref={ref} container={container} />}
    </ContainerContext.Consumer>
  )
);

export const TooltipWithContainerFromContext = React.forwardRef(
  (props, ref) => (
    <ContainerContext.Consumer>
      {(container) => <Tooltip {...props} ref={ref} appendTo={container} />}
    </ContainerContext.Consumer>
  )
);
