/**
 * @file Slice of the state object that handles the contents of the field notes
 * panel.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

type FieldNotesSliceState = ReadonlyDeep<{
  contents: string;
}>;

const initialState: FieldNotesSliceState = {
  contents: `
You can use Markdown syntax to format your notes, such as **bold**, _italic_ or ~~strikethrough~~.
See https://quickref.me/markdown for a quick reference guide to Markdown syntax.
    `.trim(),
};

const { actions, reducer } = createSlice({
  name: 'field-notes',
  initialState,
  reducers: {
    updateFieldNotes(state, { payload: contents }: PayloadAction<string>) {
      state.contents = contents;
    },
  },
});

export const { updateFieldNotes } = actions;

export default reducer;
