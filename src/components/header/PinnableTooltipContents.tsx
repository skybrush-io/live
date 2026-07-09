import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack, { StackProps } from '@mui/material/Stack';
import { use } from 'react';
import type { ItemConfigType, Workbench } from 'react-flexible-workbench';

import Keep from '~/icons/Keep';
import { WorkbenchContext } from '~/workbench';

type Props = Omit<StackProps, 'component'> & {
  component: string;
  title?: string;
};

const getIdForComponent = (component: string) => `pinned-${component}`;

const isPinned = (workbench: Workbench, component: string) => {
  return workbench.findPanelById(getIdForComponent(component)) !== undefined;
}

const pinToWorkbenchOrBringToFront = (workbench: Workbench, component: string, title: string | undefined) => {
  const id = getIdForComponent(component);
  if (!isPinned(workbench, component)) {
    const config: ItemConfigType = {
      ...workbench.createItemConfigurationFor(component),
      id,
      title,
    };
    workbench.addNewItemWithConfiguration(config);
  } else {
    workbench.bringToFront(id);
  }
}

const PinnableTooltipContents = ({ children, component, sx, title, ...rest }: Props) => {
  const workbench = use(WorkbenchContext);
  const pinned = isPinned(workbench, component);

  return (
    <Stack direction='row' gap={0.5} sx={{ alignItems: 'center', ...sx }} {...rest}>
      <Box>{children}</Box>
      <Stack direction='column' sx={{ alignSelf: 'flex-start' }}>
        <IconButton size='small' edge='end' onClick={() => {
          pinToWorkbenchOrBringToFront(workbench, component, title);
        }} disabled={pinned}>
          <Keep fontSize='inherit' />
        </IconButton>
      </Stack>
    </Stack>
  );
};

export default PinnableTooltipContents;
