import PropTypes from 'prop-types';
import React from 'react';
import { PerspectiveBar as WbPerspectiveBar } from 'react-flexible-workbench';
import { connect } from 'react-redux';

import Colors from '~/components/colors';
import {
  setWorkbenchHasHeaders,
  setWorkbenchIsFixed,
} from '~/features/workbench/slice';
import perspectives from '~/perspectives';
import workbench from '~/workbench';

const BADGE_PROPS = {
  color: Colors.info,
  offset: [3, 3],
};

const PerspectiveBar = ({ switchToPerspective }) => (
  <WbPerspectiveBar
    badgeProps={BADGE_PROPS}
    editable={false}
    storage={perspectives}
    workbench={workbench}
    onChange={(id) => {
      switchToPerspective(id);
      return false; // needed to allow WbPerspectiveBar to switch
    }}
  />
);

PerspectiveBar.propTypes = {
  switchToPerspective: PropTypes.func.isRequired,
};

export default connect(
  // mapStateToProps
  () => ({}),
  // mapDispatchToProps
  {
    switchToPerspective(id) {
      return async (dispatch) => {
        const perspective = await perspectives.get(id);
        dispatch(setWorkbenchHasHeaders(perspective.state.settings.hasHeaders));
        dispatch(setWorkbenchIsFixed(perspective.isFixed));

        // rest is done by the WbPerspectiveBar component
      };
    },
  }
)(PerspectiveBar);
