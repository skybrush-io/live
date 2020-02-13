import isEmpty from 'lodash-es/isEmpty';
import PropTypes from 'prop-types';
import React from 'react';

import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';
import ImageBlurCircular from '@material-ui/icons/BlurCircular';
import ImageBlurOn from '@material-ui/icons/BlurOn';

import MappingButtonGroup from './MappingButtonGroup';
import UAVOperationsButtonGroup from './UAVOperationsButtonGroup';

const useStyles = makeStyles(
  theme => ({
    divider: {
      alignSelf: 'stretch',
      height: 'auto',
      margin: theme.spacing(1, 0.5)
    },

    toggleButton: {
      border: 0
    }
  }),
  { name: 'UAVToolbar' }
);

/**
 * Main toolbar for controlling the UAVs.
 */
const UAVToolbar = React.forwardRef(
  ({ fitSelectedUAVs, selectedUAVIds, ...rest }, ref) => {
    const classes = useStyles();

    const isSelectionEmpty = isEmpty(selectedUAVIds);

    return (
      <Toolbar ref={ref} disableGutters variant="dense" {...rest}>
        <UAVOperationsButtonGroup selectedUAVIds={selectedUAVIds} />

        <Box flex={1} />

        {fitSelectedUAVs && (
          <IconButton style={{ float: 'right' }} onClick={fitSelectedUAVs}>
            {isSelectionEmpty ? <ImageBlurOn /> : <ImageBlurCircular />}
          </IconButton>
        )}

        <MappingButtonGroup />
      </Toolbar>
    );
  }
);

UAVToolbar.propTypes = {
  fitSelectedUAVs: PropTypes.func,
  selectedUAVIds: PropTypes.array
};

export default UAVToolbar;
