import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

export const GenericHeaderButton = React.forwardRef(
  ({ children, isDisabled, label, onClick }, ref) => (
    <div
      ref={ref}
      className={clsx('wb-module', { 'wb-module-disabled': isDisabled })}
      onClick={onClick}
    >
      <span className="wb-icon wb-module-icon">{children}</span>
      {label ? <span className="wb-label wb-module-label">{label}</span> : null}
    </div>
  )
);

GenericHeaderButton.propTypes = {
  children: PropTypes.node,
  isDisabled: PropTypes.bool,
  label: PropTypes.string,
  onClick: PropTypes.func
};

export default GenericHeaderButton;
