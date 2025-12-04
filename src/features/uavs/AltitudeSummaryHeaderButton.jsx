import Terrain from '@mui/icons-material/Terrain';
import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { Translation } from 'react-i18next';
import { connect } from 'react-redux';

import { GenericHeaderButton } from '@skybrush/mui-components';

import { isConnected } from '~/features/servers/selectors';
import { getAltitudeSummaryType } from '~/features/settings/selectors';
import { updateAppSettings } from '~/features/settings/slice';
import { usePeriodicSelector } from '~/hooks/usePeriodicSelector';
import {
  AltitudeSummaryType,
  describeAltitudeSummaryType,
} from '~/model/settings';

import { getActiveUAVIds, getUAVById } from './selectors';

// `makeStyles` from @material-ui cannot be used, as `GenericHeaderButton`
// doesn't merge its own classes with the provided `className` from outside.
export const buttonStyle = {
  justifyContent: 'space-between',
  textAlign: 'right',
  width: 95,
};

export const iconContainerStyle = {
  width: 24,
  marginTop: -10,

  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
};

export const typeIndicatorStyle = {
  fontSize: 11,
  fontWeight: 'bold',
  textTransform: 'uppercase',
  textAlign: 'center',
  userSelect: 'none',
};

/**
 * Mapping from altitude summary types to functions that take a UAV object and
 * return an altitude according to the selected summary type.
 * (AMSL, AHL, AGL or local)
 */
const altitudeGetters = {
  [AltitudeSummaryType.AMSL]: (uav) => uav?.position?.amsl,
  [AltitudeSummaryType.AHL]: (uav) => uav?.position?.ahl,
  [AltitudeSummaryType.AGL]: (uav) => uav?.position?.agl,

  [AltitudeSummaryType.XYZ]: (uav) => {
    const pos = uav?.localPosition;
    return Array.isArray(pos) ? pos[2] : null;
  },
  dummy: () => null,
};

const findAltitudeBounds = (type) => (state) => {
  const getter = altitudeGetters[type] || altitudeGetters.dummy;

  let minAltitude = Number.POSITIVE_INFINITY;
  let maxAltitude = Number.NEGATIVE_INFINITY;

  for (const uavId of getActiveUAVIds(state)) {
    const uav = getUAVById(state, uavId);
    const altitude = getter(uav);

    if (!isNil(altitude)) {
      minAltitude = Math.min(minAltitude, altitude);
      maxAltitude = Math.max(maxAltitude, altitude);
    }
  }

  if (Number.isFinite(minAltitude)) {
    return { min: minAltitude, max: maxAltitude };
  } else {
    return { min: null, max: null };
  }
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
  const selector = useMemo(() => findAltitudeBounds(type), [type]);
  const { min, max } = usePeriodicSelector(selector, isConnected ? 1000 : null);

  return (
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
      tooltip={getTooltipForType(type)}
      onClick={() =>
        onRequestTypeChange(getNextTypeForAltitudeSummaryType(type))
      }
    >
      <div style={iconContainerStyle}>
        <Terrain />
        <div style={typeIndicatorStyle}>{type}</div>
      </div>
    </GenericHeaderButton>
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
