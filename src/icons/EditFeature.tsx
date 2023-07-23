import * as React from 'react';

import SvgIcon from '@material-ui/core/SvgIcon';

const EditFeature = React.forwardRef<SVGSVGElement>((props, ref) => (
  <SvgIcon {...props} ref={ref}>
    <path d='M3 3 L20.38 15.16 L15.16 20.38 L3 3z' />
  </SvgIcon>
));

export default EditFeature;
