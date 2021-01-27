import PropTypes from 'prop-types';
import React from 'react';
import { HexColorPicker } from 'react-colorful';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

import ColoredButton from '~/components/ColoredButton';
import { getCurrentColorInLightControlPanel } from '~/features/light-control/selectors';
import { setColor, setColorAndActivate } from '~/features/light-control/slice';

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
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gridGap: theme.spacing(0.5),
      padding: theme.spacing(1),
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
      <LightButton
        color='#000000'
        label='All lights off'
        style={{ gridColumn: '1 / span 3' }}
        onClick={onSetColorAndActivate}
      />
      <LightButton
        color='#ffffff'
        label='All lights on'
        style={{ gridColumn: '4 / span 3' }}
        onClick={onSetColorAndActivate}
      />
      <LightButton color='#ff0000' onClick={onSetColorAndActivate} />
      <LightButton color='#ffff00' onClick={onSetColorAndActivate} />
      <LightButton color='#00ff00' onClick={onSetColorAndActivate} />
      <LightButton color='#00ffff' onClick={onSetColorAndActivate} />
      <LightButton color='#0000ff' onClick={onSetColorAndActivate} />
      <LightButton color='#ff00ff' onClick={onSetColorAndActivate} />
      <Box style={{ gridColumn: '1 / span 6', margin: 'auto' }}>
        <HexColorPicker color={color} onChange={onSetColor} />
      </Box>
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
    onSetColor: setColor,
    onSetColorAndActivate: setColorAndActivate,
  }
)(LightControlGrid);
