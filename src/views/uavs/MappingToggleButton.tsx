import Mapping from '@mui/icons-material/FormatLineSpacing';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import ToggleButton from '~/components/ToggleButton';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import { isShowingMissionIds } from '~/features/settings/selectors';
import { toggleMissionIds } from '~/features/settings/slice';
import { type RootState } from '~/store/reducers';

type MappingToggleButtonProps = {
  selected: boolean;
  onChange: (event: React.MouseEvent<HTMLElement>) => void;
};

/**
 * Toggle button that indicates whether we are primarily showing UAV IDs or
 * mission IDs in the application.
 */
function MappingToggleButton({ selected, onChange }: MappingToggleButtonProps) {
  const { t } = useTranslation();

  return (
    <Tooltip content={t('mappingToggleButton.sortByMissionID')}>
      <ToggleButton value='missionIds' selected={selected} onChange={onChange}>
        <Mapping />
      </ToggleButton>
    </Tooltip>
  );
}

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    selected: isShowingMissionIds(state),
  }),
  // mapDispatchToProps
  {
    onChange: toggleMissionIds,
  }
)(MappingToggleButton);
