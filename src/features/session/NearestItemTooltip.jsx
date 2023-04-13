import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { followCursor } from 'tippy.js';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import DroneInfoTooltipContent from '~/features/uavs/DroneInfoTooltipContent';
import { isUavId, globalIdToUavId } from '~/model/identifiers';

import { getNearestFeatureIdForTooltip } from './selectors';

const supportsTooltip = (featureId) => featureId && isUavId(featureId);

const NearestItemTooltipContent = React.memo(({ featureId }) => {
  if (isUavId(featureId)) {
    return <DroneInfoTooltipContent id={globalIdToUavId(featureId)} />;
  } else return null;
});

NearestItemTooltipContent.propTypes = {
  featureId: PropTypes.string,
};

const NearestItemTooltip = ({ featureId, ...rest }) => {
  const visible = supportsTooltip(featureId);
  return (
    <Tooltip
      followCursor
      ignoreAttributes
      mouseOnly
      duration={0}
      placement='right'
      plugins={[followCursor]}
      visible={visible}
      content={
        visible ? <NearestItemTooltipContent featureId={featureId} /> : null
      }
      {...rest}
    />
  );
};

NearestItemTooltip.propTypes = {
  featureId: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state) => ({
    featureId: getNearestFeatureIdForTooltip(state),
  }),
  // mapDispatchToProps
  {}
)(NearestItemTooltip);
