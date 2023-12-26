import { createAction } from '@reduxjs/toolkit';

import { type Identifier } from '~/utils/collections';

export const notifyObjectsDeletedOnServer = createAction<Identifier[]>(
  'objects/notifyObjectsDeletedOnServer'
);
