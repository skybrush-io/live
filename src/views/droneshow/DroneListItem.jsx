import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  theme => ({
    root: {
      alignItems: 'center',
      cursor: 'hand',
      display: 'flex',
      flexDirection: 'column',
      padding: theme.spacing(1),
      minWidth: theme.spacing(10),

      '&:hover': {
        backgroundColor: theme.palette.action.hover
      },

      '& div': {
        marginBottom: theme.spacing(0.5)
      },
      '& div:last-child': {
        marginBottom: 0
      },
      transition: theme.transitions.create(['background-color'])
    },

    selected: {
      backgroundColor: theme.palette.action.selected + ' !important'
    }
  }),
  {
    name: 'DroneListItem'
  }
);

const DroneListItem = ({ children, onClick, selected }) => {
  const classes = useStyles();
  return (
    <div
      className={clsx(classes.root, selected && classes.selected)}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

DroneListItem.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  selected: PropTypes.bool
};

export default DroneListItem;
