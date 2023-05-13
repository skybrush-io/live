/**
 * @file Slice of the state object that handles the contents of the field notes
 * panel.
 */

import { createSlice } from '@reduxjs/toolkit';

const { actions, reducer } = createSlice({
  name: 'field-notes',

  initialState: {
    contents: `
### Field Notes
You can use Markdown syntax to format your notes, such as:
**bold**
_italic_
~~strikethrough~~
> quote
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
