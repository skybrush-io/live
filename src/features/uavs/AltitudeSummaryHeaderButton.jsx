import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Translation } from 'react-i18next';
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

// `makeStyles` from @material-ui cannot be used, as `GenericHeaderButton`
// doesn't merge its own classes with the provided `className` from outside.
const buttonStyle = {
  justifyContent: 'space-between',
  textAlign: 'right',
  width: 95,
};

const iconContainerStyle = {
  width: 24,
  marginTop: -10,

  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
};

const typeIndicatorStyle = {
  fontSize: 11,
  fontWeight: 'bold',
  textTransform: 'uppercase',
  textAlign: 'center',
  userSelect: 'none',
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
      return AltitudeSummaryType.AGL;
    case AltitudeSummaryType.AGL:
      return AltitudeSummaryType.XYZ;
    case AltitudeSummaryType.XYZ:
      return AltitudeSummaryType.AMSL;
    default:
      return AltitudeSummaryType.AMSL;
  }
};

const getTooltipForType = (type) => (
  <Translation>
    {(t) => (
      <div>
        {t('altitudeSummaryButton.showingCurrent', {
          altitudeType: describeAltitudeSummaryType(type, { short: true }),
        })}
        <br />
        {t('altitudeSummaryButton.clickToChange', {
          altitudeType: describeAltitudeSummaryType(
            getNextTypeForAltitudeSummaryType(type),
            {
              short: true,
            }
          ),
        })}
      </div>
    )}
  </Translation>
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
          isConnected && typeof max === 'number'
            ? `${max.toFixed(1)}\u00A0m`
            : '—'
        }
        secondaryLabel={
          isConnected && typeof min === 'number'
            ? `${min.toFixed(1)}\u00A0m`
            : '—'
        }
        style={buttonStyle}
        onClick={() =>
          onRequestTypeChange(getNextTypeForAltitudeSummaryType(type))
        }
      >
        <div style={iconContainerStyle}>
          <Terrain />
          <div style={typeIndicatorStyle}>{type}</div>
        </div>

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
