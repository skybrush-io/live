import NavigationFullscreen from '@mui/icons-material/Fullscreen';
import NavigationFullscreenExit from '@mui/icons-material/FullscreenExit';
import { Translation } from 'react-i18next';
import { useEvent, useUpdate } from 'react-use';
import ScreenFull from 'screenfull';

import {
  GenericHeaderButton,
  type GenericHeaderButtonProps,
} from '@skybrush/mui-components';

import { toggleFullScreen } from '~/utils/full-screen';

type Props = {
  isFullscreen: boolean;
} & GenericHeaderButtonProps;

const FullScreenButtonPresentation = ({ isFullscreen, ...rest }: Props) => (
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

const FullScreenButton = () => {
  const update = useUpdate();

  useEvent('change', update, ScreenFull);
  useEvent('error', update, ScreenFull);

  return (
    <FullScreenButtonPresentation
      isFullscreen={ScreenFull.isFullscreen}
      disabled={!ScreenFull.isEnabled}
      onClick={toggleFullScreen}
    />
  );
};

export default FullScreenButton;
