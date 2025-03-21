import isEmpty from 'lodash-es/isEmpty';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Toolbar, { type ToolbarProps } from '@material-ui/core/Toolbar';
import ImageBlurCircular from '@material-ui/icons/BlurCircular';
import ImageBlurOn from '@material-ui/icons/BlurOn';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';

import UAVOperationsButtonGroup from '~/components/uavs/UAVOperationsButtonGroup';

import MappingButtonGroup from './MappingButtonGroup';

import { isBroadcast } from '~/features/session/selectors';
import type { RootState } from '~/store/reducers';
import { useTranslation } from 'react-i18next';

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
            <IconButton style={{ float: 'right' }} onClick={fitSelectedUAVs}>
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
  }),
  // mapDispatchToProps
  {}
)(UAVToolbar);
