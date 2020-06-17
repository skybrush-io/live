import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      border: '1px solid rgba(0, 0, 0, 0.3)',
      borderRadius: '50%',
      color: 'black',
      height: '1em',
      minWidth:
        '1em' /* needed for narrow cases; setting width alone is not enough */,
      marginRight: theme.spacing(2),
      position: 'relative',
      width: '1em',
    },

    inline: {
      display: 'inline-block',
      marginRight: [0, '!important'],
      verticalAlign: 'sub',
    },

    'size-small': {
      fontSize: '0.75em',
    },

    'size-large': {
      fontSize: '1.25em',
    },
  }),
  { name: 'ColoredLight' }
);

/**
 * Small component resembling an LED light that can be set to an arbitrary
 * color, with no semantic meaning.
 *
 * Use <code>StatusLight</code> for lights that do convey a semantic meaning
 * to ensure a uniform visual representation of the message semantics throughout
 * the app.
 */
const ColoredLight = ({ color, inline, size, style, ...rest }) => {
  const classes = useStyles();

  return (
    <Box
      className={clsx(
        classes.root,
        inline && classes.inline,
        classes[`size-${size}`]
      )}
      component={inline ? 'span' : 'div'}
      style={{
        backgroundColor: color,
        ...style,
      }}
      {...rest}
    />
  );
};

ColoredLight.propTypes = {
  color: PropTypes.string,
  inline: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'normal', 'large']),
  style: PropTypes.object,
};

ColoredLight.defaultProps = {
  color: '#000000',
  size: 'normal',
};

export default ColoredLight;
