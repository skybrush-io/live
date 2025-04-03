import React from 'react';
import { useTranslation } from 'react-i18next';

import { type GroupSelectionInfo, type UAVGroup } from './types';
import UAVListSection, { type UAVListSectionProps } from './UAVListSection';
import type { UAVListLayout } from '~/features/settings/types';
import { getLabelForUAVGroup } from './utils';

export type UAVListBodyProps = Readonly<{
  id?: string;
  groups: UAVGroup[];
  itemRenderer: UAVListSectionProps['itemRenderer'];
  layout: UAVListLayout;
  onSelectSection: UAVListSectionProps['onSelect'];
  selectionInfo: GroupSelectionInfo[];
}>;

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
