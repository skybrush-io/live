import React from 'react';

import SvgIcon from '@material-ui/core/SvgIcon';

const ShapeLine = React.forwardRef((props, ref) => (
  <SvgIcon {...props} ref={ref}>
    <path d='M6,11c2.76,0,5-2.24,5-5S8.76,1,6,1S1,3.24,1,6S3.24,11,6,11z M6,3c1.65,0,3,1.35,3,3c0,1.65-1.35,3-3,3S3,7.65,3,6 C3,4.35,4.35,3,6,3z' />
    <path d='M21,14h-5c-1.1,0-2,0.9-2,2v5c0,1.1,0.9,2,2,2h5c1.1,0,2-0.9,2-2v-5C23,14.9,22.1,14,21,14z M21,21h-5v-5h5V21z' />
    <path d='M17.71,7.7C18.11,7.89,18.54,8,19,8c1.65,0,3-1.35,3-3s-1.35-3-3-3s-3,1.35-3,3c0,0.46,0.11,0.89,0.3,1.29L6.29,16.3 C5.89,16.11,5.46,16,5,16c-1.65,0-3,1.35-3,3s1.35,3,3,3s3-1.35,3-3c0-0.46-0.11-0.89-0.3-1.29L17.71,7.7z' />
  </SvgIcon>
));

export default ShapeLine;
