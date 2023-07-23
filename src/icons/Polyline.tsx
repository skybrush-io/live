import * as React from 'react';

import SvgIcon from '@material-ui/core/SvgIcon';

const Polyline = React.forwardRef<SVGSVGElement>((props, ref) => (
  <SvgIcon {...props} ref={ref}>
    <path d='M15 16v1.26l-6-3v-3.17L11.7 8H16V2h-6v4.9L7.3 10H3v6h5l7 3.5V22h6v-6z' />
  </SvgIcon>
));

export default Polyline;
