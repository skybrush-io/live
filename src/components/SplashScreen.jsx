import React from 'react';
import { CoverPagePresentation as CoverPage } from 'react-cover-page';

const logo = require('~/../assets/icons/splash.png').default;

export default () => (
  <CoverPage
    loading
    icon={<img src={logo} width={96} height={96} alt="" />}
    title={
      <span>
        Flock<b style={{ fontWeight: 300 }}>wave</b>
      </span>
    }
  />
);
