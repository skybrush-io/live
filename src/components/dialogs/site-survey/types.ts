import type { TFunction } from 'i18next';

import { type ShowData } from '~/features/site-survey/state';

export type TranslationProps = {
  t: TFunction;
};
export type DispatchProps = {
  initializeWithData: (swarm: ShowData) => void;
  closeDialog: () => void;
};
