import Box from '@mui/material/Box';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { DraggableDialog } from '@skybrush/mui-components';
import { EnvironmentType } from '@skybrush/show-format';

import { getShowEnvironmentType } from '~/features/show/selectors';
import { closeEnvironmentEditorDialog } from '~/features/show/slice';
import type { RootState } from '~/store/reducers';

import IndoorEnvironmentEditor from './IndoorEnvironmentEditor';
import OutdoorEnvironmentEditor from './OutdoorEnvironmentEditor';

const instructionsByType: Record<EnvironmentType, string> = {
  [EnvironmentType.INDOOR]: 'environmentEditorDialog.indoor',
  [EnvironmentType.OUTDOOR]: 'environmentEditorDialog.outdoor',
};

type InstructionsProps = {
  type: EnvironmentType;
};

const Instructions = ({ type }: InstructionsProps) => {
  const { t } = useTranslation();

  return <Typography variant='body1'>{t(instructionsByType[type])}</Typography>;
};

type Props = {
  editing: boolean;
  onClose: () => void;
  type: EnvironmentType;
};

/**
 * Presentation component for the dialog that shows the form that the user
 * can use to edit the environment settings of a drone show.
 */
const EnvironmentEditorDialog = ({ editing = false, onClose, type }: Props) => {
  const { t } = useTranslation();

  return (
    <DraggableDialog
      fullWidth
      open={editing}
      maxWidth='sm'
      title={t('environmentEditorDialog.environmentSettings')}
      onClose={onClose}
    >
      <DialogContent>
        <Box>
          <Instructions type={type} />
          {type === EnvironmentType.OUTDOOR && <OutdoorEnvironmentEditor />}
          {type === EnvironmentType.INDOOR && <IndoorEnvironmentEditor />}
        </Box>
      </DialogContent>
    </DraggableDialog>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    editing: state.show.environment.editing,
    type: getShowEnvironmentType(state),
  }),

  // mapDispatchToProps
  {
    onClose: closeEnvironmentEditorDialog,
  }
)(EnvironmentEditorDialog);
