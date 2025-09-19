import NavigateBefore from '@mui/icons-material/NavigateBefore';
import NavigateNext from '@mui/icons-material/NavigateNext';
import SaveAlt from '@mui/icons-material/SaveAlt';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { Base64 } from 'js-base64';
import memoizee from 'memoizee';
import PropTypes from 'prop-types';
import React, { useCallback, useMemo, useState } from 'react';
import { connect } from 'react-redux';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';
import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import AsyncGuard from '~/components/AsyncGuard';
import FileButton from '~/components/FileButton';
import { selectableListOf } from '~/components/helpers/lists';
import { openUploadDialogForJob } from '~/features/upload/slice';
import { useMessageHub } from '~/hooks';
import { readFileAsArrayBuffer } from '~/utils/files';
import { formatData } from '~/utils/formatting';

import { JOB_TYPE } from './constants';
import { isFirmwareUpdateSetupDialogOpen } from './selectors';
import {
  hideFirmwareUpdateSetupDialog,
  showFirmwareUpdateSetupDialog,
} from './slice';

const FirmwareUpdateTargetSelectorPresentation = selectableListOf(
  ({ name, id }, { onItemSelected }) => (
    <ListItemButton key={id} onClick={onItemSelected}>
      <ListItemText primary={name} secondary={id} />
    </ListItemButton>
  ),
  {
    dataProvider: 'items',
    displayName: 'FirmwareUpdateTargetSelectorPresentation',
    backgroundHint: (
      <BackgroundHint
        header='No firmware update targets'
        text='Enable firmware update support in the server first'
        style={{ minHeight: 200 }}
      />
    ),
  }
);

const FirmwareUpdateTargetSelector = ({ getTargets, ...rest }) => (
  <AsyncGuard
    func={getTargets}
    errorMessage='Error while loading firmware update targets from server'
    loadingMessage='Retrieving firmware update targets...'
  >
    {(items) => (
      <FirmwareUpdateTargetSelectorPresentation items={items} {...rest} />
    )}
  </AsyncGuard>
);

FirmwareUpdateTargetSelector.propTypes = {
  getTargets: PropTypes.func,
  onChange: PropTypes.func,
};

/**
 * Presentation component for the dialog that allows the user to assemble a
 * list of parameters to upload to the drones.
 */
const FirmwareUpdateSetupDialog = ({ onClose, onNext, open }) => {
  const [target, setTarget] = useState();
  const [file, setFile] = useState();

  const messageHub = useMessageHub();
  const getTargets = useMemo(
    () =>
      memoizee(() => messageHub.query.getFirmwareUpdateTargets(), {
        maxAge: 10000,
        promise: true,
      }),
    [messageHub]
  );

  const onBack = useCallback(() => {
    setTarget();
    setFile();
  }, [setFile, setTarget]);

  return (
    <DraggableDialog
      fullWidth
      open={open}
      maxWidth='sm'
      title={`Update ${target?.name ?? 'firmware'}`}
      // TODO: Maybe call `getTargets.clear()` on close instead of `maxAge`
      onClose={onClose}
    >
      <DialogContent>
        <Box>
          <Collapse in={target === undefined}>
            <FirmwareUpdateTargetSelector
              getTargets={getTargets}
              onChange={(_event, value) => setTarget(value)}
            />
          </Collapse>
          <Collapse in={target !== undefined}>
            <FileButton style={{ width: '100%' }} onSelected={setFile}>
              <Box sx={{ textAlign: 'center' }}>
                <SaveAlt style={{ fontSize: 128 }} />
                <br />
                {file === undefined
                  ? 'Click or drag & drop to select file'
                  : `${file.name} (${formatData(file.size)})`}
              </Box>
            </FileButton>
          </Collapse>
        </Box>
        <Collapse in={target !== undefined}>
          <DialogActions>
            <Button startIcon={<NavigateBefore />} onClick={onBack}>
              Back
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              disabled={file === undefined}
              endIcon={<NavigateNext />}
              onClick={() => onNext(target, file)}
            >
              Next
            </Button>
          </DialogActions>
        </Collapse>
      </DialogContent>
    </DraggableDialog>
  );
};

FirmwareUpdateSetupDialog.propTypes = {
  onClose: PropTypes.func,
  onNext: PropTypes.func,
  open: PropTypes.bool,
};

export default connect(
  // mapStateToProps
  (state) => ({
    open: isFirmwareUpdateSetupDialogOpen(state),
  }),

  // mapDispatchToProps
  {
    onClose: hideFirmwareUpdateSetupDialog,
    onNext: (target, file) => async (dispatch) => {
      dispatch(hideFirmwareUpdateSetupDialog());
      dispatch(
        openUploadDialogForJob({
          job: {
            type: JOB_TYPE,
            payload: {
              target: target.id,
              blob: Base64.fromUint8Array(await readFileAsArrayBuffer(file)),
            },
          },
          options: {
            backAction: showFirmwareUpdateSetupDialog(),
          },
        })
      );
    },
  }
)(FirmwareUpdateSetupDialog);
