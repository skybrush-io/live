import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import Mapping from '@material-ui/icons/FormatLineSpacing';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';

import ToggleButton from '~/components/ToggleButton';
import { isShowingMissionIds } from '~/features/settings/selectors';
import { toggleMissionIds } from '~/features/settings/slice';

/**
 * Toggle button that indicates whether we are primarily showing UAV IDs or
 * mission IDs in the application.
 */
const MappingToggleButton = ({ selected, onChange, t }) => (
  <Tooltip content={t('mappingToggleButton.sortByMissionID')}>
    <ToggleButton value='missionIds' selected={selected} onChange={onChange}>
      <Mapping />
    </ToggleButton>
  </Tooltip>
);

MappingToggleButton.propTypes = {
  selected: PropTypes.bool,
  onChange: PropTypes.func,
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    selected: isShowingMissionIds(state),
  }),
  // mapDispatchToProps
  {
    onChange: toggleMissionIds,
  }
)(withTranslation()(MappingToggleButton));
