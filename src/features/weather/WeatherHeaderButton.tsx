import differenceInMinutes from 'date-fns/differenceInMinutes';
import format from 'date-fns/format';
import type { CSSProperties } from 'react';
import { connect } from 'react-redux';
import TimeAgo from 'react-timeago';
import { useToggle } from 'react-use';

import type { Status } from '@skybrush/app-theme-mui';
import { colorForStatus } from '@skybrush/app-theme-mui';
import {
  GenericHeaderButton,
  LazyTooltip,
  SidebarBadge,
} from '@skybrush/mui-components';

import { usePeriodicRefresh } from '~/hooks';
import Sunrise from '~/icons/Sunrise';
import Sunset from '~/icons/Sunset';
import type { RootState } from '~/store/reducers';
import { shortRelativeTimeFormatter } from '~/utils/formatting';

import {
  getSunriseSunsetTimesForMapViewCenterPosition,
  getWeatherBadgeStatus,
} from './selectors';
import WeatherDetailsMiniList from './WeatherDetailsMiniList';

const BADGE_OFFSET = [24, 8];

const buttonStyle: CSSProperties = {
  justifyContent: 'space-between',
  textAlign: 'right',
  width: 90,
};

type WeatherHeaderButtonProps = {
  badgeStatus: Status | null;
  sunrise?: Date;
  sunset?: Date;
};

const WeatherHeaderButton = ({
  badgeStatus,
  sunrise,
  sunset,
}: WeatherHeaderButtonProps) => {
  /* Show sunset time if we are closer to the sunset than to the sunrise */
  // eslint-disable-next-line @eslint-react/purity
  const now = new Date();
  const [negate, toggleNegate] = useToggle(false);
  let shouldShowSunset =
    !sunrise ||
    (sunset &&
      Math.abs(differenceInMinutes(sunrise, now)) >
        Math.abs(differenceInMinutes(sunset, now)));
  if (negate) {
    shouldShowSunset = !shouldShowSunset;
  }

  const referenceTime = shouldShowSunset ? sunset : sunrise;

  /* refresh every 30s */
  usePeriodicRefresh(30000);

  return (
    <LazyTooltip content={<WeatherDetailsMiniList />}>
      <GenericHeaderButton
        label={referenceTime ? format(referenceTime, 'H:mm') : '—'}
        secondaryLabel={
          referenceTime ? (
            <TimeAgo
              formatter={shortRelativeTimeFormatter}
              date={referenceTime}
            />
          ) : null
        }
        style={buttonStyle}
        onClick={() => toggleNegate()}
      >
        {shouldShowSunset ? <Sunset /> : <Sunrise />}
        <SidebarBadge
          anchor='topLeft'
          color={badgeStatus ? colorForStatus(badgeStatus) : undefined}
          offset={BADGE_OFFSET}
          visible={Boolean(badgeStatus)}
        />
      </GenericHeaderButton>
    </LazyTooltip>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    ...getSunriseSunsetTimesForMapViewCenterPosition(state),
    badgeStatus: getWeatherBadgeStatus(state),
  }),
  // mapDispatchToProps
  {}
)(WeatherHeaderButton);
