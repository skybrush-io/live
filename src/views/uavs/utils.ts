import isNil from 'lodash-es/isNil';

import {
  isMissionSlotId,
  isUavId,
  missionSlotIdToGlobalId,
  uavIdToGlobalId,
} from '~/model/identifiers';
import { getSelection } from '~/selectors/selection';
import type { RootState } from '~/store/reducers';
import { UAVGroupType, type Item, type UAVGroup } from './types';

export const globalIdToDOMNodeId = (id: string): string =>
  `global-dom-node-${id.replace('$', '-')}`;

export const uavIdToDOMNodeId = (id: string | undefined): string | undefined =>
  id ? globalIdToDOMNodeId(uavIdToGlobalId(id)) : undefined;

export function itemToGlobalId(item: Item): string | undefined {
  if (!isNil(item[0])) {
    return uavIdToGlobalId(item[0]);
    // eslint-disable-next-line unicorn/no-negated-condition
  } else if (!isNil(item[1])) {
    return missionSlotIdToGlobalId(String(item[1]));
  } else {
    return undefined;
  }
}

/**
 * Returns the lable of the given UAV group.
 *
 * @param group The UAV group
 * @param t Translation function from react-i18next
 * @returns The label of the UAV group on the UI
 */
export function getLabelForUAVGroup(
  group: UAVGroup,
  t: (key: string) => string
): string {
  if (group.label) {
    return group.label;
  }

  switch (group.type) {
    case UAVGroupType.ALL:
      return t('UAVList.allUAVs');
    case UAVGroupType.ASSIGNED:
      return t('UAVList.assignedUAVs');
    case UAVGroupType.SPARE:
      return t('UAVList.spareUAVs');
  }

  return '';
}

export function getSelectedUAVIdsAndMissionSlotIds(state: RootState): string[] {
  return getSelection(state).filter((id) => isUavId(id) || isMissionSlotId(id));
}
