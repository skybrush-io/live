import config from 'config';
import overrides from 'config-overrides';

import PropTypes from 'prop-types';
import { CoverPagePresentation as CoverPage } from 'react-cover-page';

import 'react-cover-page/themes/default.css';

import skybrushLogo from '~/../assets/img/skybrush-logo.svg';

const SplashScreen = ({ loading, visible }) => {
  let iconWidth = 96;
  let iconHeight = 96;
  let srcSet = '';

  if (config.branding.splashIcon.width) {
    iconWidth = config.branding.splashIcon.width;
  }
  if (config.branding.splashIcon.height) {
    iconHeight = config.branding.splashIcon.height;
  }

  if (config.branding.splashIcon.srcSet.twoX) {
    srcSet = config.branding.splashIcon.srcSet.twoX + ' 2x';
  }

  return (
    <CoverPage
      footer={
        // Only show the footer if the title has been overridden
        overrides?.branding?.splashTitle && (
          <>
            <b style={{ verticalAlign: 'middle' }}>Powered by</b>
            <img
              style={{ verticalAlign: 'middle' }}
              src={skybrushLogo}
              width={188}
              height={24}
            />
          </>
        )
      }
      loading={loading}
      icon={
        <img
          src={config.branding.splashIcon.srcSet.default}
          srcSet={srcSet}
          width={iconWidth}
          height={iconHeight}
        />
      }
      title={config.branding.splashTitle}
      visible={visible}
    />
  );
};

SplashScreen.propTypes = {
  loading: PropTypes.bool,
  visible: PropTypes.bool,
};

export default SplashScreen;
