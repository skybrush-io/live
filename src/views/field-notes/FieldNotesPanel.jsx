/**
 * @file Component for viewing, editing and exporting markdown notes.
 */

import formatDate from 'date-fns/format';
import debounce from 'lodash-es/debounce';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';

import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';

import IconButton from '@material-ui/core/IconButton';
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

const FieldNotesPanel = ({ contents, updateFieldNotes }) => {
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
        style={{ height: '100%' }}
        options={SIMPLE_MDE_OPTIONS}
        value={contents}
        onChange={debounce(updateFieldNotes, 1000)}
      />
      <Tooltip content='Export notes as Markdown file' placement='left'>
        <IconButton
          style={{ position: 'absolute', top: 0, right: 0 }}
          onClick={exportNotes}
        >
          <Save />
        </IconButton>
      </Tooltip>
    </>
  );
};

FieldNotesPanel.propTypes = {
  contents: PropTypes.string,
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
)(FieldNotesPanel);
