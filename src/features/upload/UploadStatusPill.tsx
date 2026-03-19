import Box from '@mui/material/Box';
import clsx from 'clsx';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';
import { StatusPill, Tooltip } from '@skybrush/mui-components';

import { Status } from '~/components/semantics';
import type { RootState } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';

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

type UploadStatus = {
  hollow?: boolean;
  status: Status;
  message?: string;
};

/**
 * Dummy status selector for slots that do not have a corresponding UAV.
 */
const uploadStatusSelectorForNil = (): UploadStatus => ({
  hollow: true,
  status: Status.OFF,
});

/**
 * Selector factory that takes a UAV ID and returns a selector instance that
 * takes the Redux store and returns the upload status code of the given UAV.
 */
const makeUploadStatusSelectorForUavId = (uavId?: Identifier) =>
  uavId === undefined
    ? uploadStatusSelectorForNil
    : (state: RootState): UploadStatus => ({
        status: getUploadStatusCodeMapping(state)[uavId] ?? Status.OFF,
        message: getUploadErrorMessageMapping(state)[uavId] ?? '',
      });

type StateProps = UploadStatus;

type DispatchProps = {
  onClick?: (uavId: Identifier) => void;
};

type OwnProps = {
  children?: React.ReactNode;
  uavId?: Identifier;
};

type UploadStatusPillProps = OwnProps & StateProps & DispatchProps;

const UploadStatusPill = ({
  children,
  message,
  onClick,
  uavId,
  ...rest
}: UploadStatusPillProps) => {
  const classes = useStyles();
  const clickHandler = onClick && uavId ? () => onClick(uavId) : undefined;
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

export default connect(
  // mapStateToProps
  (state: RootState, ownProps: OwnProps) =>
    makeUploadStatusSelectorForUavId(ownProps.uavId)(state),
  // mapDispatchToProps
  {
    onClick: toggleUavInWaitingQueue,
  }
)(UploadStatusPill);
