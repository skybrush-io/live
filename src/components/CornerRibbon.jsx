import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import '~/../assets/css/corner-ribbon.less';

const positionMap = {
  topLeft: 'left-top',
  topRight: 'right-top',
  bottomLeft: 'left-bottom',
  bottomRight: 'right-bottom',
};

const CornerRibbon = ({ label, position }) => (
  <div
    className={clsx('corner-ribbon', positionMap[position])}
    data-ribbon={label}
  />
);

CornerRibbon.propTypes = {
  label: PropTypes.string,
  position: PropTypes.oneOf(Object.keys(positionMap)),
};

CornerRibbon.defaultProps = {
  position: 'topRight',
};

export default CornerRibbon;
