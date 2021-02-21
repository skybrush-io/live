import PropTypes from 'prop-types';
import React from 'react';
import { CoverPagePresentation as CoverPage } from 'react-cover-page';

import logo from '~/../assets/icons/splash.png';

console.log(logo);

const SplashScreen = ({ visible }) => (
  <CoverPage
    loading={visible}
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
  visible: PropTypes.bool,
};

export default SplashScreen;
