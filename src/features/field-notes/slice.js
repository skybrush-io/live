/**
 * @file Slice of the state object that handles the contents of the field notes
 * panel.
 */

import { createSlice } from '@reduxjs/toolkit';

const { actions, reducer } = createSlice({
  name: 'field-notes',

  initialState: {
    contents: `
You can use Markdown syntax to format your notes, such as **bold**, _italic_ or ~~strikethrough~~.
See https://quickref.me/markdown for a quick reference guide to Markdown syntax.
    `.trim(),
  },

  reducers: {
    updateFieldNotes(state, { payload: contents }) {
      state.contents = contents;
    },
  },
});

export const { updateFieldNotes } = actions;

export default reducer;
