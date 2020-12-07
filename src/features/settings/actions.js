import { updateAppSettings } from './slice';

export function updateUAVVoltageThreshold(name, value) {
  return (dispatch, getState) => {
    const state = getState();
    let {
      fullChargeVoltage,
      lowVoltageThreshold,
      criticalVoltageThreshold,
    } = state.settings.uavs;

    if (name === 'criticalVoltageThreshold') {
      criticalVoltageThreshold = value;
      lowVoltageThreshold = Math.max(
        criticalVoltageThreshold,
        lowVoltageThreshold
      );
      fullChargeVoltage = Math.max(lowVoltageThreshold, fullChargeVoltage);
    } else if (name === 'lowVoltageThreshold') {
      lowVoltageThreshold = value;
      fullChargeVoltage = Math.max(lowVoltageThreshold, fullChargeVoltage);
      criticalVoltageThreshold = Math.min(
        lowVoltageThreshold,
        criticalVoltageThreshold
      );
    } else if (name === 'fullChargeVoltage') {
      fullChargeVoltage = value;
      lowVoltageThreshold = Math.min(fullChargeVoltage, lowVoltageThreshold);
      criticalVoltageThreshold = Math.min(
        lowVoltageThreshold,
        criticalVoltageThreshold
      );
    }

    dispatch(
      updateAppSettings('uavs', {
        fullChargeVoltage,
        lowVoltageThreshold,
        criticalVoltageThreshold,
      })
    );
  };
}
