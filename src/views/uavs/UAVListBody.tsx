/**
 * @file Component that displays the status of the known UAVs in a Skybrush
 * flock.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

import type { GroupedUAVIds, GroupSelectionInfo } from './types';
import UAVListSection, { type UAVListSectionProps } from './UAVListSection';
import type { UAVListLayout } from '~/features/settings/types';

type UAVListBodyProps = Readonly<{
  editingMapping: boolean;
  itemRenderer: UAVListSectionProps['itemRenderer'];
  layout: UAVListLayout;
  onSelectSection: UAVListSectionProps['onSelect'];
  selectionInfo: GroupSelectionInfo;
  showMissionIds: boolean;
  uavIds: Pick<GroupedUAVIds, 'mainUAVIds' | 'spareUAVIds'>;
}>;

/**
 * Presentation component for showing the drone show configuration view.
 */
const UAVListBody = ({
  itemRenderer,
  editingMapping,
  layout,
  onSelectSection,
  selectionInfo,
  showMissionIds,
  uavIds,
}: UAVListBodyProps): JSX.Element => {
  const { mainUAVIds, spareUAVIds } = uavIds;
  const { t } = useTranslation();

  return (
    <>
      <UAVListSection
        items={mainUAVIds}
        itemRenderer={itemRenderer}
        label={
          showMissionIds ? t('UAVList.assignedUAVs') : t('UAVList.allUAVs')
        }
        layout={layout}
        value='mainUAVIds'
        onSelect={onSelectSection}
        {...selectionInfo.mainUAVIds}
      />
      <UAVListSection
        items={spareUAVIds}
        itemRenderer={itemRenderer}
        label={t('UAVList.spareUAVs')}
        layout={layout}
        value='spareUAVIds'
        forceVisible={editingMapping}
        onSelect={onSelectSection}
        {...selectionInfo.spareUAVIds}
      />
    </>
  );
};

export default UAVListBody;
