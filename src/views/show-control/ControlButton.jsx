import clsx from 'clsx';
import createColor from 'color';
import PropTypes from 'prop-types';
import React from 'react';

import ButtonBase from '@material-ui/core/ButtonBase';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  (theme) => ({
    icon: {
      fontSize: '48px',
    },

    root: ({ color }) => {
      const parsedColor = createColor(color);
      return {
        ...theme.typography.button,
        backgroundColor: color,
        borderRadius: theme.spacing(0.5),
        boxShadow: theme.shadows[2],
        boxSizing: 'border-box',
        color: parsedColor.isLight()
          ? 'rgba(0, 0, 0, 0.87)'
          : 'rgba(255, 255, 255, 0.87)',
        flexDirection: 'column',
        padding: theme.spacing(1, 3),
        textDecoration: 'none',
        transition: theme.transitions.create(
          ['background-color', 'box-shadow'],
          {
            duration: theme.transitions.duration.short,
          }
        ),

        '&:hover': {
          backgroundColor: parsedColor.darken(0.16).string(),
          boxShadow: theme.shadows[4],
        },
      };
    },
  }),
  {
    name: 'ControlButton',
  }
);

const ControlButton = ({ children, className, color, icon, ...rest }) => {
  const classes = useStyles({ color });

  return (
    <ButtonBase focusRipple className={clsx(className, classes.root)} {...rest}>
      {icon && <div className={classes.icon}>{icon}</div>}
      <div className={classes.label}>{children}</div>
    </ButtonBase>
  );
};

ControlButton.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
  className: PropTypes.string,
  color: PropTypes.string,
  icon: PropTypes.node,
};

export default ControlButton;
