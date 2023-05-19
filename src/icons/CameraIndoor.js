import React from 'react';

import SvgIcon from '@material-ui/core/SvgIcon';

const CameraIndoor = React.forwardRef((props, ref) => (
  <SvgIcon {...props} ref={ref}>
    <path d='M12,3L4,9v12h16V9L12,3z M16,16.06L14,15v1c0,0.55-0.45,1-1,1H9c-0.55,0-1-0.45-1-1v-4c0-0.55,0.45-1,1-1h4 c0.55,0,1,0.45,1,1v1l2-1.06V16.06z' />
  </SvgIcon>
));

export default CameraIndoor;
