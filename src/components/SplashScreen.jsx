import PropTypes from 'prop-types';
import React from 'react';
import { CoverPagePresentation as CoverPage } from 'react-cover-page';

import 'react-cover-page/themes/default.css';

import logo from '~/../assets/icons/splash.png';

const SplashScreen = ({ loading, visible }) => (
  <CoverPage
    loading={loading}
    icon={<img src={logo} width={96} height={96} alt='' />}
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
