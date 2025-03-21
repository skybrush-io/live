import PropTypes from 'prop-types';
import React from 'react';
import { Trans, Translation } from 'react-i18next';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import Toolbar, { type ToolbarProps } from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';
import Close from '@material-ui/icons/Close';
import Keyboard from '@material-ui/icons/Keyboard';

import { cancelMappingEditorSessionAtCurrentSlot } from '~/features/mission/slice';

const useStyles = makeStyles(
  (theme) => ({
    box: {
      userSelect: 'none',
      whiteSpace: 'nowrap',
    },
    divider: {
      alignSelf: 'stretch',
      height: 'auto',
      margin: theme.spacing(1, 1),
    },
  }),
  { name: 'MappingSlotEditorToolbar' }
);

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
          <IconButton disabled>
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
          <Box flex={1} />
          <IconButton onClick={cancelMappingEditorSessionAtCurrentSlot}>
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
