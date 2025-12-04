import Close from '@mui/icons-material/Close';
import Keyboard from '@mui/icons-material/Keyboard';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Toolbar, { type ToolbarProps } from '@mui/material/Toolbar';
import type { Theme } from '@mui/material/styles';
import React from 'react';
import { Trans, Translation } from 'react-i18next';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';

import { cancelMappingEditorSessionAtCurrentSlot } from '~/features/mission/slice';

const useStyles = makeStyles((theme: Theme) => ({
  box: {
    userSelect: 'none',
    whiteSpace: 'nowrap',
  },
  divider: {
    alignSelf: 'stretch',
    height: 'auto',
    margin: theme.spacing(1, 1),
  },
}));

type MappingSlotEditorToolbarProps = ToolbarProps &
  Readonly<{
    cancelMappingEditorSessionAtCurrentSlot: () => void;
  }>;

const MappingSlotEditorToolbar = React.forwardRef<
  HTMLDivElement,
  MappingSlotEditorToolbarProps
>(({ cancelMappingEditorSessionAtCurrentSlot, ...rest }, ref) => {
  const classes = useStyles();
  return (
    <Translation>
      {(t) => (
        <Toolbar ref={ref} disableGutters variant='dense' {...rest}>
          <IconButton disabled size='large'>
            <Keyboard />
          </IconButton>
          <Box className={classes.box}>
            <kbd>Enter</kbd> {t('general.action.save')}
          </Box>
          <Divider orientation='vertical' className={classes.divider} />
          <Box className={classes.box}>
            <kbd>Tab</kbd> {t('mappingSlotEditorToolbar.selectNextEmptySlot')}
          </Box>
          <Divider orientation='vertical' className={classes.divider} />
          <Box className={classes.box}>
            <Trans
              i18nKey='mappingSlotEditorToolbar.reverseDirection'
              components={{ kbd: <kbd /> }}
            />
          </Box>
          <Box sx={{ flex: 1 }} />
          <IconButton
            size='large'
            onClick={cancelMappingEditorSessionAtCurrentSlot}
          >
            <Close />
          </IconButton>
        </Toolbar>
      )}
    </Translation>
  );
});

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  { cancelMappingEditorSessionAtCurrentSlot },
  null,
  { forwardRef: true }
)(MappingSlotEditorToolbar);
