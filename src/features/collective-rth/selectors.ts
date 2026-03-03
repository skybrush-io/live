import { Base64 } from 'js-base64';
import { createSelector } from 'reselect';

import type { AppSelector, RootState } from '~/store/reducers';

import type { CollectiveRTHDialogState, TransformationResult } from './slice';

const selectState: AppSelector<CollectiveRTHDialogState> = (state) =>
  state.dialogs.collectiveRTH;

export const isDialogOpen: AppSelector<boolean> = (state) =>
  selectState(state).open;

export const selectTransformationInProgress: AppSelector<boolean> =
  createSelector(selectState, ({ result }) => result?.state === 'loading');

export const selectTransformationError: AppSelector<string | undefined> =
  createSelector(selectState, ({ result }) =>
    result?.state === 'error' ? result.error : undefined
  );

export const selectResult: AppSelector<TransformationResult | undefined> =
  createSelector(selectState, ({ result }) =>
    result?.state === 'success' ? result : undefined
  );

export const selectTransformedShowAsBase64String: AppSelector<
  string | undefined
> = createSelector(selectResult, (result) => result?.show);

export const selectTransformedShowBlob: AppSelector<Blob | undefined> = (
  state: RootState
) => {
  const result = selectTransformedShowAsBase64String(state);
  if (result === undefined) {
    return undefined;
  }

  return new Blob([Base64.toUint8Array(result) as any]);
};
