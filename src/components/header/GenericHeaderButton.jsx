import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import Tooltip from '~/components/Tooltip';

export const GenericHeaderButton = React.forwardRef(
  ({ children, isDisabled, id, label, onClick, tooltip }, ref) => {
    const result = (
      <div
        ref={ref}
        id={id}
        className={clsx('wb-module', { 'wb-module-disabled': isDisabled })}
        onClick={onClick}
      >
        <span className='wb-icon wb-module-icon'>{children}</span>
        {label ? (
          <span className='wb-label wb-module-label'>{label}</span>
        ) : null}
      </div>
    );

    if (tooltip) {
      return <Tooltip content={tooltip}>{result}</Tooltip>;
    }

    return result;
  }
);

GenericHeaderButton.propTypes = {
  children: PropTypes.node,
  id: PropTypes.string,
  isDisabled: PropTypes.bool,
  label: PropTypes.string,
  onClick: PropTypes.func,
  tooltip: PropTypes.string,
};

export default GenericHeaderButton;
