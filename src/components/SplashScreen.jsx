import React from 'react';
import { CoverPagePresentation as CoverPage } from 'react-cover-page';

const logo = require('~/../assets/icons/splash.png').default;

export default () => (
  <CoverPage
    loading
    icon={<img src={logo} width={96} height={96} alt="" />}
    title={
      <span>
        skybrush <b style={{ fontWeight: 400 }}>live</b>
      </span>
    }
  />
);
