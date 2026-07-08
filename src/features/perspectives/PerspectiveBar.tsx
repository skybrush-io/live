import { PerspectiveBar as WbPerspectiveBar } from 'react-flexible-workbench';
import { connect } from 'react-redux';

import Colors from '~/components/colors';
import {
  setWorkbenchHasHeaders,
  setWorkbenchIsFixed,
} from '~/features/workbench/slice';
import perspectives from '~/perspectives';
import type { AppDispatch } from '~/store/reducers';
import workbench from '~/workbench';

import type { Perspective } from './types';

const BADGE_PROPS = {
  color: Colors.info,
  offset: [3, 3],
};

type Props = {
  switchToPerspective: (id: string) => void;
};

const PerspectiveBar = ({ switchToPerspective }: Props) => (
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

export default connect(
  // mapStateToProps
  () => ({}),
  // mapDispatchToProps
  {
    switchToPerspective(id: string) {
      return async (dispatch: AppDispatch) => {
        const perspective = await perspectives.get(id);
        if (perspective) {
          const ourPerspective = perspective as Perspective;
          dispatch(
            setWorkbenchHasHeaders(ourPerspective.state.settings.hasHeaders)
          );
          dispatch(setWorkbenchIsFixed(ourPerspective.isFixed));
        }

        // rest is done by the WbPerspectiveBar component
      };
    },
  }
)(PerspectiveBar);
