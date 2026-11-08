import Edit from '@mui/icons-material/Edit';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { isMappingEditable } from '~/features/mission/selectors';
import type { RootState } from '~/store/reducers';

type MappingEditorIndicatorProps = Readonly<{
  visible: boolean;
}>;

/**
 * Floating pill shown over the UAV list while the mapping editor is active.
 * Clicking on a list item edits the mapping in this mode instead of selecting
 * the UAV, and users tend to miss the toolbar change.
 */
const MappingEditorIndicator = ({ visible }: MappingEditorIndicatorProps) => {
  const { t } = useTranslation();

  return (
    <Fade in={visible}>
      <Chip
        color='warning'
        icon={<Edit />}
        label={t('mappingEditorIndicator.editingEnabled')}
        sx={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          boxShadow: 4,
          fontWeight: 'bold',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
    </Fade>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    visible: isMappingEditable(state),
  })
)(MappingEditorIndicator);
