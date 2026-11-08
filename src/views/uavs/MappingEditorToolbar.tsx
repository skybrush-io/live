import Check from '@mui/icons-material/Check';
import Mouse from '@mui/icons-material/Mouse';
import OpenWith from '@mui/icons-material/OpenWith';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar, { type ToolbarProps } from '@mui/material/Toolbar';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import Colors from '~/components/colors';
import { isMappingBeingCalculated } from '~/features/mission/selectors';
import { finishMappingEditorSession } from '~/features/mission/slice';
import type { RootState } from '~/store/reducers';

import MappingCalculationInProgress from './MappingCalculationInProgress';
import MappingToolsMenu from './MappingToolsMenu';

const instructionsStyle: React.CSSProperties = {
  overflow: 'ellipsis',
  userSelect: 'none',
  whiteSpace: 'nowrap',
};

type MappingEditorToolbarProps = ToolbarProps &
  Readonly<{
    calculating: boolean;
    finishMappingEditorSession: () => void;
  }>;

const Instructions = () => {
  const { t } = useTranslation();
  return (
    <>
      <IconButton disabled size='large'>
        <Mouse />
      </IconButton>
      <Box style={instructionsStyle}>
        {t('mappingEditorToolbar.clickToEdit')}
      </Box>
      <IconButton disabled size='large'>
        <OpenWith />
      </IconButton>
      <Box style={instructionsStyle}>{t('mappingEditorToolbar.dragNodes')}</Box>
    </>
  );
};

const MappingEditorToolbar = ({
  ref,
  calculating,
  finishMappingEditorSession,
  ...rest
}: MappingEditorToolbarProps) => (
  <Toolbar ref={ref} disableGutters variant='dense' {...rest}>
    {calculating ? (
      <Box pl={2}>
        <MappingCalculationInProgress size='small' />
      </Box>
    ) : (
      <Instructions />
    )}
    <Box sx={{ flex: 1 }} />
    <IconButton onClick={finishMappingEditorSession}>
      <Check htmlColor={Colors.success} />
    </IconButton>
    <MappingToolsMenu />
  </Toolbar>
);

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    calculating: isMappingBeingCalculated(state),
  }),
  // mapDispatchToProps
  {
    finishMappingEditorSession,
  },
  null,
  { forwardRef: true }
)(MappingEditorToolbar);
