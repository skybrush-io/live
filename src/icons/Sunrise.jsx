import React from 'react';

import SvgIcon from '@material-ui/core/SvgIcon';

const Sunrise = React.forwardRef((props, ref) => (
  <SvgIcon {...props} ref={ref}>
    <path d='M3 12h4a5 5 0 0 1 5-5a5 5 0 0 1 5 5h4a1 1 0 0 1 1 1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1a1 1 0 0 1 1-1m12 0a3 3 0 0 0-3-3a3 3 0 0 0-3 3h6M12 2l2.39 3.42C13.65 5.15 12.84 5 12 5c-.84 0-1.65.15-2.39.42L12 2M3.34 7l4.16-.35A7.2 7.2 0 0 0 5.94 8.5c-.44.74-.69 1.5-.83 2.29L3.34 7m17.31 0l-1.77 3.79a7.023 7.023 0 0 0-2.38-4.15l4.15.36m-7.94 9.3l3.11 3.11a.996.996 0 1 1-1.41 1.41L12 18.41l-2.41 2.41a.996.996 0 1 1-1.41-1.41l3.11-3.11c.21-.2.45-.3.71-.3c.26 0 .5.1.71.3z' />
  </SvgIcon>
));

export default Sunrise;
