import ImageBlurCircular from '@mui/icons-material/BlurCircular';
import ImageBlurOn from '@mui/icons-material/BlurOn';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar, { type ToolbarProps } from '@mui/material/Toolbar';
import isEmpty from 'lodash-es/isEmpty';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import UAVOperationsButtonGroup from '~/components/uavs/UAVOperationsButtonGroup';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import { isBroadcast } from '~/features/session/selectors';
import { getSelectedUAVIds } from '~/features/uavs/selectors';
import type { RootState } from '~/store/reducers';

import MappingButtonGroup from './MappingButtonGroup';

type UAVToolbarProps = ToolbarProps &
  Readonly<{
    fitSelectedUAVs?: () => void;
    isBroadcast: boolean;
    selectedUAVIds: string[];
  }>;

/**
 * Main toolbar for controlling the UAVs.
 */
const UAVToolbar = React.forwardRef<HTMLDivElement, UAVToolbarProps>(
  ({ fitSelectedUAVs, isBroadcast, selectedUAVIds, ...rest }, ref) => {
    const isSelectionEmpty = isEmpty(selectedUAVIds);
    const { t } = useTranslation();

    return (
      <Toolbar ref={ref} disableGutters variant='dense' {...rest}>
        <Box width={4} />

        <UAVOperationsButtonGroup
          broadcast={isBroadcast}
          selectedUAVIds={selectedUAVIds}
        />

        <Box flex={1} />

        {fitSelectedUAVs && (
          <Tooltip
            content={
              isSelectionEmpty
                ? t('uavToolbar.fitAllFeaturesIntoView')
                : t('uavToolbar.fitSelectionIntoView')
            }
          >
            <IconButton
              style={{ float: 'right' }}
              size='large'
              onClick={fitSelectedUAVs}
            >
              {isSelectionEmpty ? <ImageBlurOn /> : <ImageBlurCircular />}
            </IconButton>
          </Tooltip>
        )}

        <MappingButtonGroup />
      </Toolbar>
    );
  }
);

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    isBroadcast: isBroadcast(state),
    selectedUAVIds: getSelectedUAVIds(state),
  }),
  // mapDispatchToProps
  {}
)(UAVToolbar);
