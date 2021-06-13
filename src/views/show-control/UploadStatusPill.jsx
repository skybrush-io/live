import clsx from 'clsx';
import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

import { Status } from '~/components/semantics';
import StatusPill from '~/components/StatusPill';
import { toggleUavInWaitingQueue } from '~/features/show/actions';
import { getUploadStatusCodeMapping } from '~/features/show/selectors';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(0.5),
    cursor: 'pointer',
  },

  hover: {
    backgroundColor: theme.palette.action.hover,
  },

  selectable: {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

const uploadStatusSelectorForNil = () => ({ hollow: true, status: Status.OFF });

const makeUploadStatusSelectorForUavId = (uavId) =>
  isNil(uavId)
    ? uploadStatusSelectorForNil
    : (state) => ({
        status: getUploadStatusCodeMapping(state)[uavId] || Status.OFF,
      });

const UploadStatusPill = ({ children, onClick, uavId, ...rest }) => {
  const classes = useStyles();
  const clickHandler = onClick && uavId ? () => onClick(uavId) : null;

  return (
    <Box
      className={clsx(classes.root, clickHandler && classes.selectable)}
      onClick={clickHandler}
    >
      <StatusPill {...rest}>{children}</StatusPill>
    </Box>
  );
};

UploadStatusPill.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  uavId: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (_state, { uavId }) => makeUploadStatusSelectorForUavId(uavId),
  // mapDispatchToProps
  {
    onClick: toggleUavInWaitingQueue,
  }
)(UploadStatusPill);
