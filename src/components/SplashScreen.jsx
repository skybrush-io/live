import config from 'config';

import PropTypes from 'prop-types';
import React from 'react';
import { CoverPagePresentation as CoverPage } from 'react-cover-page';

import 'react-cover-page/themes/default.css';

const SplashScreen = ({ loading, visible }) => (
  <CoverPage
    loading={loading}
    icon={<img src={config.branding.splashIcon} width={96} height={96} />}
    title={
      <span>
        skybrush <b style={{ fontWeight: 400 }}>live</b>
      </span>
    }
    visible={visible}
  />
);

SplashScreen.propTypes = {
  loading: PropTypes.bool,
  visible: PropTypes.bool,
};

export default SplashScreen;
