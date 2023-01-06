import React from 'react';

import SvgIcon from '@material-ui/core/SvgIcon';

const Download = React.forwardRef((props, ref) => (
  <SvgIcon {...props} ref={ref}>
    <path d='M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z' />
  </SvgIcon>
));

export default Download;
