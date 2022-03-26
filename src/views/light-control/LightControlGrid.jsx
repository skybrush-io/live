import PropTypes from 'prop-types';
import React from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

import ColoredButton from '~/components/ColoredButton';
import {
  setColorAndActivate,
  setColorAndUpdateServerIfActive,
} from '~/features/light-control/actions';
import { getCurrentColorInLightControlPanel } from '~/features/light-control/selectors';

const LightButton = ({ color, label, onClick, ...rest }) => (
  <ColoredButton
    dense
    color={color}
    {...rest}
    onClick={onClick ? () => onClick(color) : undefined}
  >
    {label}
  </ColoredButton>
);

LightButton.propTypes = {
  color: PropTypes.string,
  label: PropTypes.string,
  onClick: PropTypes.func,
};

LightButton.defaultProps = {
  label: '\u00A0',
};

const useStyles = makeStyles(
  (theme) => ({
    root: {
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
      height: '100%',
      padding: theme.spacing(1),

      '& .react-colorful': {
        borderRadius: theme.shape.borderRadius,
        width: '100%',
      },

      '& .react-colorful__saturation': {
        borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
      },

      '& .react-colorful__last_control': {
        borderRadius: `0 0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px`,
      },
    },

    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gridGap: theme.spacing(0.5),
    },

    picker: {
      flex: 1,
      padding: theme.spacing(1, 0),
    },

    textField: {
      background: theme.palette.action.hover,
      border: 'none',
      borderRadius: theme.shape.borderRadius,
      color: theme.palette.text.primary,
      padding: theme.spacing(1),
      textAlign: 'center',
      textTransform: 'uppercase',

      '&:focus': {
        outline: 'none',
      },
    },
  }),
  { name: 'LightControlGrid' }
);

/**
 * Panel that shows the widgets that are needed to control the LED lights on
 * the drone swarm from the GCS before or during a drone show.
 */
const LightControlGrid = ({ color, onSetColor, onSetColorAndActivate }) => {
  const classes = useStyles();
  return (
    <Box className={classes.root}>
      <Box className={classes.grid}>
        <LightButton
          color='#000000'
          label='All off'
          style={{ gridColumn: '1 / span 2' }}
          onClick={onSetColorAndActivate}
        />
        <LightButton
          color='#404040'
          label='25%'
          onClick={onSetColorAndActivate}
        />
        <LightButton
          color='#808080'
          label='50%'
          onClick={onSetColorAndActivate}
        />
        <LightButton
          color='#ffffff'
          label='All on'
          style={{ gridColumn: '5 / span 3' }}
          onClick={onSetColorAndActivate}
        />
        <LightButton color='#ff0000' onClick={onSetColorAndActivate} />
        <LightButton color='#ffff00' onClick={onSetColorAndActivate} />
        <LightButton color='#00ff00' onClick={onSetColorAndActivate} />
        <LightButton color='#00ffff' onClick={onSetColorAndActivate} />
        <LightButton color='#0000ff' onClick={onSetColorAndActivate} />
        <LightButton color='#ff00ff' onClick={onSetColorAndActivate} />
      </Box>
      <HexColorPicker
        className={classes.picker}
        color={color}
        onChange={onSetColor}
      />
      <HexColorInput
        prefixed
        className={classes.textField}
        color={color}
        onChange={onSetColor}
      />
    </Box>
  );
};

LightControlGrid.propTypes = {
  color: PropTypes.string,
  onSetColor: PropTypes.func,
  onSetColorAndActivate: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    color: getCurrentColorInLightControlPanel(state),
  }),
  // mapDispatchToProps
  {
    onSetColor: setColorAndUpdateServerIfActive,
    onSetColorAndActivate: setColorAndActivate,
  }
)(LightControlGrid);
