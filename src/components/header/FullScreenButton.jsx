import NavigationFullscreen from '@material-ui/icons/Fullscreen';
import NavigationFullscreenExit from '@material-ui/icons/FullscreenExit';

import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { useEvent, useUpdate } from 'react-use';
import ScreenFull from 'screenfull';

const FullScreenButtonPresentation = ({
  isEnabled,
  isFullscreen,
  label,
  onClick
}) => {
  const classes = ['wb-module'];
  if (!isEnabled) {
    classes.push('wb-module-disabled');
  }

  return (
    <div className={classes.join(' ')} onClick={onClick}>
      <span className="wb-icon wb-module-icon">
        {isFullscreen ? <NavigationFullscreenExit /> : <NavigationFullscreen />}
      </span>
      {label ? <span className="wb-label wb-module-label">{label}</span> : null}
    </div>
  );
};

FullScreenButtonPresentation.propTypes = {
  isEnabled: PropTypes.bool.isRequired,
  isFullscreen: PropTypes.bool.isRequired,
  label: PropTypes.string,
  onClick: PropTypes.func
};

const FullScreenButton = () => {
  const toggleFullscreen = useCallback(() => ScreenFull.toggle(), []);
  const update = useUpdate();

  useEvent('change', update, ScreenFull);
  useEvent('error', update, ScreenFull);

  return (
    <FullScreenButtonPresentation
      isFullscreen={ScreenFull.isFullscreen}
      isEnabled={ScreenFull.isEnabled}
      onClick={toggleFullscreen}
    />
  );
};

export default FullScreenButton;
