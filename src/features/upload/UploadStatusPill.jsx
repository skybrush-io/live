import clsx from 'clsx';
import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import { Status } from '~/components/semantics';
import StatusPill from '~/components/StatusPill';

import { toggleUavInWaitingQueue } from './actions';
import {
  getUploadErrorMessageMapping,
  getUploadStatusCodeMapping,
} from './selectors';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(0.5),
  },

  hover: {
    backgroundColor: theme.palette.action.hover,
  },

  selectable: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

/**
 * Dummy status selector for slots that do not have a corresponding UAV.
 */
const uploadStatusSelectorForNil = () => ({ hollow: true, status: Status.OFF });

/**
 * Selector factory that takes a UAV ID and returns a selector instance that
 * takes the Redux store and returns the upload status code of the given UAV.
 */
const makeUploadStatusSelectorForUavId = (uavId) =>
  isNil(uavId)
    ? uploadStatusSelectorForNil
    : (state) => ({
        status: getUploadStatusCodeMapping(state)[uavId] || Status.OFF,
        message: getUploadErrorMessageMapping(state)[uavId] || '',
      });

const UploadStatusPill = ({ children, message, onClick, uavId, ...rest }) => {
  const classes = useStyles();
  const clickHandler = onClick && uavId ? () => onClick(uavId) : null;
  const boxedPill = (
    <Box
      className={clsx(classes.root, clickHandler && classes.selectable)}
      onClick={clickHandler}
    >
      <StatusPill {...rest}>{children}</StatusPill>
    </Box>
  );

  return message ? <Tooltip content={message}>{boxedPill}</Tooltip> : boxedPill;
};

UploadStatusPill.propTypes = {
  children: PropTypes.node,
  message: PropTypes.string,
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
