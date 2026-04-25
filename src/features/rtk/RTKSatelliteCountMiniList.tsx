import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { MiniListDivider, MiniListItem } from '@skybrush/mui-components';

import type { RootState } from '~/store/reducers';

import { getSatelliteIds } from './selectors';

type GNSSSystemDescription = {
  name: string;
  flag: string;
};

const gnssSystems: Record<string, GNSSSystemDescription> = {
  C: {
    name: 'BeiDou',
    flag: '🇨🇳',
  },
  E: {
    name: 'Galileo',
    flag: '🇪🇺',
  },
  G: {
    name: 'GPS',
    flag: '🇺🇸',
  },
  R: {
    name: 'GLONASS',
    flag: '🇷🇺',
  },
  other: {
    name: 'Other',
    flag: '🏳',
  },
};

const gnssSystemOrder = ['G', 'R', 'E', 'C', 'other'];

const countSatellitesByGNSSSystem = (satelliteIds: string[]) => {
  const result: Record<string, number> = {};

  for (const satelliteId of satelliteIds) {
    let gnssSystemCode = satelliteId.length > 0 ? satelliteId.charAt(0) : null;

    if (!gnssSystemCode || !gnssSystems[gnssSystemCode]) {
      gnssSystemCode = 'other';
    }

    if (result[gnssSystemCode]) {
      result[gnssSystemCode]++;
    } else {
      result[gnssSystemCode] = 1;
    }
  }

  return result;
};

type Props = {
  satelliteIds: string[];
};

const RTKSatelliteCountMiniList = ({ satelliteIds }: Props) => {
  const { t } = useTranslation();
  const counts = countSatellitesByGNSSSystem(satelliteIds);
  return (
    <>
      <MiniListItem
        primaryText={
          '\u00A0🌍\u00A0\u00A0\u00A0' + t('RTKStatusMiniList.satelliteCount')
        }
        secondaryText={String(satelliteIds.length)}
      />
      {satelliteIds.length > 0 && <MiniListDivider />}
      {gnssSystemOrder.map(
        (code) =>
          counts[code] && (
            <MiniListItem
              key={code}
              primaryText={`\u00A0${gnssSystems[code].flag}\u00A0\u00A0\u00A0${gnssSystems[code].name}`}
              secondaryText={counts[code]}
            />
          )
      )}
    </>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    satelliteIds: getSatelliteIds(state),
  })
)(RTKSatelliteCountMiniList);
