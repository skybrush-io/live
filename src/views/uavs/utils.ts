import isNil from 'lodash-es/isNil';

import {
  isMissionSlotId,
  isUavId,
  missionSlotIdToGlobalId,
  uavIdToGlobalId,
} from '~/model/identifiers';
import { getSelection } from '~/selectors/selection';
import type { RootState } from '~/store/reducers';
import type { Item } from './types';

export const globalIdToDOMNodeId = (id: string): string =>
  `global-dom-node-${id.replace('$', '-')}`;

export const uavIdToDOMNodeId = (id: string): string =>
  globalIdToDOMNodeId(uavIdToGlobalId(id));

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

export function getSelectedUAVIdsAndMissionSlotIds(state: RootState): string[] {
  return getSelection(state).filter((id) => isUavId(id) || isMissionSlotId(id));
}
