import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import type { PreparedI18nKey } from '~/i18n';
import type { AppSelector } from '~/store/reducers';

export type Prerequisite = Readonly<{
  id: string;
  selector: AppSelector<boolean>;
  message: PreparedI18nKey;
}>;

export type ResolvedPrerequisite = Readonly<{
  id: string;
  result: boolean;
  message: string;
}>;

/**
 * Hook that resolves a constant array of prerequisites.
 *
 * Important: the hook loops over all the items in `constPrerequisites` and
 * resolves them with further hook calls. To avoid breaking React hook rules,
 * the length of `constPrerequisites` must *never* change. It is also
 * strongly recommended to make `constPrerequisites` immutable and constant.
 */
export const useConstPrerequisites = (
  constPrerequisites: readonly Prerequisite[]
) => {
  const { t } = useTranslation();
  const prerequisites: readonly ResolvedPrerequisite[] = constPrerequisites.map(
    ({ id, selector, message }) => ({
      id,
      // ESLint rule is disabled because the length of `constPrerequisites` must never
      // change, so the number of hook calls is constant. See the comment above the
      // hook for more details.
      //
      // eslint-disable-next-line @eslint-react/rules-of-hooks
      result: useSelector(selector),
      message: message(t),
    })
  );
  const prerequisitesFulfilled = prerequisites.every(({ result }) => result);
  return {
    prerequisites,
    prerequisitesFulfilled,
  };
};
