import React from 'react';

import SvgIcon from '@material-ui/core/SvgIcon';

const Upload = React.forwardRef((props, ref) => (
  <SvgIcon {...props} ref={ref}>
    <path d='M5 20h14v-2H5v2zm0-10h4v6h6v-6h4l-7-7-7 7z' />
  </SvgIcon>
));

export default Upload;
