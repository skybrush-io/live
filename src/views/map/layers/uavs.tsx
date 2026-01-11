import { connect } from 'react-redux';

import {
  UAVsLayer as BaseUAVsLayerPresentation,
  UAVsLayerSettings as UAVsLayerSettingsPresentation,
  type UAVsLayerProps,
  type UAVsLayerSettingsProps,
} from '~/components/map/layers/uavs';
import { setLayerParametersById } from '~/features/map/layers';
import { getSelection } from '~/selectors/selection';
import type { RootState } from '~/store/reducers';

import ActiveUAVsLayerSource from '../sources/ActiveUAVsLayerSource';

export const UAVsLayerSettings = connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  (
    dispatch,
    ownProps: Omit<UAVsLayerSettingsProps, 'setLayerParametersById'>
  ) => ({
    setLayerParameters(parameters: Record<string, any>): void {
      dispatch(setLayerParametersById(ownProps.layerId, parameters));
    },
  })
)(UAVsLayerSettingsPresentation);

const UAVsLayerPresentation = (props: Omit<UAVsLayerProps, 'LayerSource'>) => (
   
  <BaseUAVsLayerPresentation {...props} LayerSource={ActiveUAVsLayerSource} />
);

export const UAVsLayer = connect(
  // mapStateToProps
  (state: RootState) => ({
    selection: getSelection(state),
  }),
  // mapDispatchToProps
  {}
)(UAVsLayerPresentation);
