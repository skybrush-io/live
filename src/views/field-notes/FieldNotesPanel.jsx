/**
 * @file Component for viewing, editing and exporting markdown notes.
 */

import formatDate from 'date-fns/format';
import debounce from 'lodash-es/debounce';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';

import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';

import IconButton from '@material-ui/core/IconButton';
import { makeStyles } from '@material-ui/core/styles';
import Save from '@material-ui/icons/Save';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import { updateFieldNotes } from '~/features/field-notes/slice';
import { writeTextToFile } from '~/utils/filesystem';

const SIMPLE_MDE_OPTIONS = {
  autoDownloadFontAwesome: false,
  spellChecker: false,
  toolbar: false,
  status: false,
  // Disable all the default hotkeys except for toggling bold and italic styles.
  shortcuts: {
    cleanBlock: null,
    drawImage: null,
    drawLink: null,
    toggleBlockquote: null,
    // toggleBold: null,
    toggleCodeBlock: null,
    toggleFullScreen: null,
    toggleHeading1: null,
    toggleHeading2: null,
    toggleHeading3: null,
    toggleHeading4: null,
    toggleHeading5: null,
    toggleHeading6: null,
    toggleHeadingBigger: null,
    toggleHeadingSmaller: null,
    // toggleItalic: null,
    toggleOrderedList: null,
    togglePreview: null,
    toggleSideBySide: null,
    toggleUnorderedList: null,
  },
};

const useStyles = makeStyles(
  (theme) => ({
    editorWrapper: {
      height: '100%',
      overflow: 'overlay',

      '&:hover': {
        '& + $saveIcon': {
          opacity: 1,
        },
      },
    },

    saveIcon: {
      position: 'absolute',
      top: 0,
      right: 0,

      opacity: 0,

      '&:hover': {
        opacity: 1,
      },

      transition: theme.transitions.create(['opacity'], {
        duration: theme.transitions.duration.short,
      }),
    },
  }),
  { name: 'FieldNotesPanel' }
);

const FieldNotesPanel = ({ contents, t, updateFieldNotes }) => {
  const classes = useStyles();

  const exportNotes = useCallback(async () => {
    writeTextToFile(
      contents,
      `notes_${formatDate(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.md`,
      { title: 'Export notes' }
    );
  }, [contents]);

  return (
    <>
      <SimpleMDE
        className={classes.editorWrapper}
        options={SIMPLE_MDE_OPTIONS}
        value={contents}
        onChange={debounce(updateFieldNotes, 1000)}
      />
      <Tooltip
        content={t('fieldNotesPanel.exportNotesAsFile')}
        placement='left'
      >
        <IconButton className={classes.saveIcon} onClick={exportNotes}>
          <Save />
        </IconButton>
      </Tooltip>
    </>
  );
};

FieldNotesPanel.propTypes = {
  contents: PropTypes.string,
  t: PropTypes.func,
  updateFieldNotes: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    contents: state.fieldNotes.contents,
  }),
  // mapDispatchToProps
  {
    updateFieldNotes,
  }
)(withTranslation()(FieldNotesPanel));
