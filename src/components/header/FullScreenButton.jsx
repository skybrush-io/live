import NavigationFullscreen from '@mui/icons-material/Fullscreen';
import NavigationFullscreenExit from '@mui/icons-material/FullscreenExit';
import PropTypes from 'prop-types';
import { useCallback } from 'react';
import { Translation } from 'react-i18next';
import { useEvent, useUpdate } from 'react-use';
import ScreenFull from 'screenfull';

import { GenericHeaderButton } from '@skybrush/mui-components';

const FullScreenButtonPresentation = ({ isFullscreen, ...rest }) => (
  <Translation>
    {(t) => (
      <GenericHeaderButton
        {...rest}
        tooltip={isFullscreen ? t('fullScreen.exit') : t('fullScreen.on')}
      >
        {isFullscreen ? <NavigationFullscreenExit /> : <NavigationFullscreen />}
      </GenericHeaderButton>
    )}
  </Translation>
);

FullScreenButtonPresentation.propTypes = {
  disabled: PropTypes.bool.isRequired,
  isFullscreen: PropTypes.bool.isRequired,
  label: PropTypes.string,
  onClick: PropTypes.func,
};

const FullScreenButton = () => {
  const toggleFullscreen = useCallback(() => ScreenFull.toggle(), []);
  const update = useUpdate();

  useEvent('change', update, ScreenFull);
  useEvent('error', update, ScreenFull);

  return (
    <FullScreenButtonPresentation
      isFullscreen={ScreenFull.isFullscreen}
      disabled={!ScreenFull.isEnabled}
      onClick={toggleFullscreen}
    />
  );
};

export default FullScreenButton;
