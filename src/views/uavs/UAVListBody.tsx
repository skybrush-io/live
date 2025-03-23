/**
 * @file Component that displays the status of the known UAVs in a Skybrush
 * flock.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

import { UAVGroupType, type GroupSelectionInfo, type UAVGroup } from './types';
import UAVListSection, { type UAVListSectionProps } from './UAVListSection';
import type { UAVListLayout } from '~/features/settings/types';

type UAVListBodyProps = Readonly<{
  groups: UAVGroup[];
  itemRenderer: UAVListSectionProps['itemRenderer'];
  layout: UAVListLayout;
  onSelectSection: UAVListSectionProps['onSelect'];
  selectionInfo: GroupSelectionInfo[];
}>;

function getLabelForUAVGroup(
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

/**
 * Presentation component for showing the drone show configuration view.
 */
const UAVListBody = ({
  groups,
  itemRenderer,
  layout,
  onSelectSection,
  selectionInfo,
}: UAVListBodyProps): JSX.Element => {
  const { t } = useTranslation();
  return (
    <>
      {groups.map((group) => (
        <UAVListSection
          key={group.id}
          items={group.items}
          itemRenderer={itemRenderer}
          label={getLabelForUAVGroup(group, t)}
          layout={layout}
          value={group.id}
          onSelect={onSelectSection}
          {...selectionInfo}
        />
      ))}
    </>
  );
};

export default UAVListBody;
