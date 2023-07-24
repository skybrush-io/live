import config from 'config';
import overrides from 'config-overrides';

import PropTypes from 'prop-types';
import React from 'react';
import { CoverPagePresentation as CoverPage } from 'react-cover-page';

import 'react-cover-page/themes/default.css';

import skybrushLogo from '~/../assets/img/skybrush-logo.svg';

const SplashScreen = ({ loading, visible }) => (
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
    icon={<img src={config.branding.splashIcon} width={96} height={96} />}
    title={config.branding.splashTitle}
    visible={visible}
  />
);

SplashScreen.propTypes = {
  loading: PropTypes.bool,
  visible: PropTypes.bool,
};

export default SplashScreen;
