import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { connect } from 'react-redux';

import Terrain from '@material-ui/icons/Terrain';

import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import { isConnected } from '~/features/servers/selectors';
import { updateAppSettings } from '~/features/settings/slice';
import { getAltitudeSummaryType } from '~/features/settings/selectors';
import {
  AltitudeSummaryType,
  describeAltitudeSummaryType,
} from '~/model/settings';

import AltitudeSummaryUpdater from './AltitudeSummaryUpdater';

const buttonStyle = {
  justifyContent: 'space-between',
  textAlign: 'right',
  width: 90,
};

const INITIAL_STATE = {
  min: null,
  max: null,
};

const getNextTypeForAltitudeSummaryType = (type) => {
  switch (type) {
    case AltitudeSummaryType.AMSL:
      return AltitudeSummaryType.AHL;
    case AltitudeSummaryType.AHL:
      return AltitudeSummaryType.XYZ;
    case AltitudeSummaryType.XYZ:
      return AltitudeSummaryType.AMSL;
    default:
      return AltitudeSummaryType.AMSL;
  }
};

const getTooltipForType = (type) => (
  <div>
    Showing {describeAltitudeSummaryType(type, { short: true })}. Click to
    change to{' '}
    {describeAltitudeSummaryType(getNextTypeForAltitudeSummaryType(type), {
      short: true,
    })}
    .
  </div>
);

const AltitudeSummaryHeaderButton = ({
  isConnected,
  onRequestTypeChange,
  type,
}) => {
  const [{ min, max }, setSummary] = useState(INITIAL_STATE);

  return (
    <Tooltip content={getTooltipForType(type)}>
      <GenericHeaderButton
        disabled={!isConnected}
        label={
          isConnected && typeof max === 'number' ? `${max.toFixed(1)}m` : '—'
        }
        secondaryLabel={
          isConnected && typeof min === 'number' ? `${min.toFixed(1)}m` : '—'
        }
        style={buttonStyle}
        onClick={() =>
          onRequestTypeChange(getNextTypeForAltitudeSummaryType(type))
        }
      >
        <Terrain />
        {isConnected && (
          <AltitudeSummaryUpdater type={type} onSetStatus={setSummary} />
        )}
      </GenericHeaderButton>
    </Tooltip>
  );
};

AltitudeSummaryHeaderButton.propTypes = {
  isConnected: PropTypes.bool,
  onRequestTypeChange: PropTypes.func,
  type: PropTypes.oneOf(Object.values(AltitudeSummaryType)),
};

export default connect(
  // mapStateToProps
  (state) => ({
    isConnected: isConnected(state),
    type: getAltitudeSummaryType(state),
  }),
  // mapDispatchToProps
  {
    onRequestTypeChange: (altitudeSummaryType) =>
      updateAppSettings('display', { altitudeSummaryType }),
  }
)(AltitudeSummaryHeaderButton);
