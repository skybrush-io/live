import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { useMeasure } from 'react-use';

import Box from '@material-ui/core/Box';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Lens from '@material-ui/icons/Lens';

import { isThemeDark } from '@skybrush/app-theme-material-ui';

import ClockSelector from './ClockSelector';
import LCDClockDisplayLabel from './LCDClockDisplayLabel';
import LCDText from './LCDText';

import { cyclePreset } from '~/features/lcd-clock/actions';
import {
  getClockIdsAndAbbreviations,
  getClockIdForLCDDisplayById,
  getPresetIndexForLCDDisplayById,
} from '~/features/lcd-clock/selectors';
import { setClockIdForClockDisplay } from '~/features/lcd-clock/slice';

import { shouldShowInactiveSegmentsOnDarkLCD } from '~/features/settings/selectors';

const noiseImage =
  'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4N3d3dtbW17e3t1dXWBgYGHh4d5eXlzc3OLi4ubm5uVlZWPj4+NjY19fX2JiYl/f39ra2uRkZGZmZlpaWmXl5dvb29xcXGTk5NnZ2c8TV1mAAAAG3RSTlNAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAvEOwtAAAFVklEQVR4XpWWB67c2BUFb3g557T/hRo9/WUMZHlgr4Bg8Z4qQgQJlHI4A8SzFVrapvmTF9O7dmYRFZ60YiBhJRCgh1FYhiLAmdvX0CzTOpNE77ME0Zty/nWWzchDtiqrmQDeuv3powQ5ta2eN0FY0InkqDD73lT9c9lEzwUNqgFHs9VQce3TVClFCQrSTfOiYkVJQBmpbq2L6iZavPnAPcoU0dSw0SUTqz/GtrGuXfbyyBniKykOWQWGqwwMA7QiYAxi+IlPdqo+hYHnUt5ZPfnsHJyNiDtnpJyayNBkF6cWoYGAMY92U2hXHF/C1M8uP/ZtYdiuj26UdAdQQSXQErwSOMzt/XWRWAz5GuSBIkwG1H3FabJ2OsUOUhGC6tK4EMtJO0ttC6IBD3kM0ve0tJwMdSfjZo+EEISaeTr9P3wYrGjXqyC1krcKdhMpxEnt5JetoulscpyzhXN5FRpuPHvbeQaKxFAEB6EN+cYN6xD7RYGpXpNndMmZgM5Dcs3YSNFDHUo2LGfZuukSWyUYirJAdYbF3MfqEKmjM+I2EfhA94iG3L7uKrR+GdWD73ydlIB+6hgref1QTlmgmbM3/LeX5GI1Ux1RWpgxpLuZ2+I+IjzZ8wqE4nilvQdkUdfhzI5QDWy+kw5Wgg2pGpeEVeCCA7b85BO3F9DzxB3cdqvBzWcmzbyMiqhzuYqtHRVG2y4x+KOlnyqla8AoWWpuBoYRxzXrfKuILl6SfiWCbjxoZJUaCBj1CjH7GIaDbc9kqBY3W/Rgjda1iqQcOJu2WW+76pZC9QG7M00dffe9hNnseupFL53r8F7YHSwJWUKP2q+k7RdsxyOB11n0xtOvnW4irMMFNV4H0uqwS5ExsmP9AxbDTc9JwgneAT5vTiUSm1E7BSflSt3bfa1tv8Di3R8n3Af7MNWzs49hmauE2wP+ttrq+AsWpFG2awvsuOqbipWHgtuvuaAE+A1Z/7gC9hesnr+7wqCwG8c5yAg3AL1fm8T9AZtp/bbJGwl1pNrE7RuOX7PeMRUERVaPpEs+yqeoSmuOlokqw49pgomjLeh7icHNlG19yjs6XXOMedYm5xH2YxpV2tc0Ro2jJfxC50ApuxGob7lMsxfTbeUv07TyYxpeLucEH1gNd4IKH2LAg5TdVhlCafZvpskfncCfx8pOhJzd76bJWeYFnFciwcYfubRc12Ip/ppIhA1/mSZ/RxjFDrJC5xifFjJpY2Xl5zXdguFqYyTR1zSp1Y9p+tktDYYSNflcxI0iyO4TPBdlRcpeqjK/piF5bklq77VSEaA+z8qmJTFzIWiitbnzR794USKBUaT0NTEsVjZqLaFVqJoPN9ODG70IPbfBHKK+/q/AWR0tJzYHRULOa4MP+W/HfGadZUbfw177G7j/OGbIs8TahLyynl4X4RinF793Oz+BU0saXtUHrVBFT/DnA3ctNPoGbs4hRIjTok8i+algT1lTHi4SxFvONKNrgQFAq2/gFnWMXgwffgYMJpiKYkmW3tTg3ZQ9Jq+f8XN+A5eeUKHWvJWJ2sgJ1Sop+wwhqFVijqWaJhwtD8MNlSBeWNNWTa5Z5kPZw5+LbVT99wqTdx29lMUH4OIG/D86ruKEauBjvH5xy6um/Sfj7ei6UUVk4AIl3MyD4MSSTOFgSwsH/QJWaQ5as7ZcmgBZkzjjU1UrQ74ci1gWBCSGHtuV1H2mhSnO3Wp/3fEV5a+4wz//6qy8JxjZsmxxy5+4w9CDNJY09T072iKG0EnOS0arEYgXqYnXcYHwjTtUNAcMelOd4xpkoqiTYICWFq0JSiPfPDQdnt+4/wuqcXY47QILbgAAAABJRU5ErkJggg==)';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      alignItems: 'stretch',
      borderBottom:
        theme.palette.type === 'light'
          ? '4px solid #f4f4f4'
          : '4px solid black',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      position: 'relative',
      userSelect: 'none',
      boxShadow:
        theme.palette.type === 'light'
          ? '0 0 6px 2px rgba(0, 0, 0, 0.4) inset'
          : undefined,
      transition: 'background-color 150ms',

      '&:last-child': {
        borderBottom: 'none',
      },
    },

    button: {
      width: 24,
      textAlign: 'center',
      lineHeight: '24px',
    },
  }),
  { name: 'LCDClockDisplay' }
);

const presets = {
  dark: [
    {
      backgroundColor: 'black',
      color: (theme) => theme.palette.secondary.main,
    },
    { backgroundColor: 'black', color: '#f00' },
    { backgroundColor: 'black', color: '#0f0' },
    { backgroundColor: 'black', color: '#fc0' },
    { backgroundColor: 'black', color: '#c0f' },
  ],
  light: [
    { backgroundColor: 'rgb(149, 177, 89)', color: 'black', noise: true },
    { backgroundColor: '#f80', color: 'black', noise: true },
    { backgroundColor: '#0cf', color: 'black', noise: true },
    { backgroundColor: '#fc0', color: 'black', noise: true },
    { backgroundColor: '#4fc', color: 'black', noise: true },
  ],
};

const call = (theme, value, defaultValue) =>
  (typeof value === 'function' ? value(theme) : value) || defaultValue;

/**
 * Component that shows the status of a clock in the style of a classic
 * 7-segment LCD display.
 */
const LCDClockDisplay = ({
  clocks,
  id,
  onAdd,
  onClockSelected,
  onNextPreset,
  onRemove,
  preset,
  selectedClockId,
  hideInactiveSegmentsOnDarkLCD,
  style,
  ...rest
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const [ref, { height, width }] = useMeasure();
  const themeType = isThemeDark(theme) ? 'dark' : 'light';
  const presetProps = presets[themeType][preset] || presets[themeType][0];

  const lcdStyle =
    themeType === 'dark'
      ? {
          color: call(theme, presetProps.color, theme.palette.secondary.main),
          decoration: 'glow',
          offSegments: !hideInactiveSegmentsOnDarkLCD,
        }
      : {
          color: call(theme, presetProps.color, 'black'),
          decoration: 'shadow',
        };

  // We assume that we show timestamps like 00:00:00:00 in the LCD display,
  // which is roughly 5x wider than tall.
  const lcdHeight =
    width > 0 && height > 0
      ? Math.floor(width < 5 * height ? width / 5 : height)
      : 0;

  const finalStyle = {
    backgroundColor: call(theme, presetProps.backgroundColor, 'black'),
    backgroundImage: call(theme, presetProps.noise, false)
      ? noiseImage
      : undefined,
    ...style,
  };

  return (
    <Box className={clsx(classes.root)} style={finalStyle} {...rest}>
      <Box
        display='flex'
        flexDirection='row'
        alignItems='center'
        justifyContent='center'
      >
        {onAdd && (
          <Box className={clsx(classes.button)} onClick={onAdd}>
            <LCDText {...lcdStyle}>+</LCDText>
          </Box>
        )}
        {onRemove && (
          <Box className={clsx(classes.button)} onClick={onRemove}>
            <LCDText {...lcdStyle}>X</LCDText>
          </Box>
        )}
        <Box flex={1} />
        <ClockSelector
          clocks={clocks}
          lcdStyle={lcdStyle}
          selectedClockId={selectedClockId}
          onClick={onClockSelected}
        />
        <Box flex={1} />
        <Box className={clsx(classes.button)} onClick={onNextPreset}>
          <LCDText {...lcdStyle}>
            <Lens style={{ fontSize: 12 }} />
          </LCDText>
        </Box>
      </Box>
      <Box
        ref={ref}
        flex={1}
        overflow='hidden'
        display='flex'
        alignItems='center'
        justifyContent='center'
      >
        <LCDClockDisplayLabel
          clockId={selectedClockId}
          height={lcdHeight}
          variant='14segment'
          {...lcdStyle}
        />
      </Box>
    </Box>
  );
};

LCDClockDisplay.propTypes = {
  clocks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string,
    })
  ),
  id: PropTypes.string,
  preset: PropTypes.number,
  onAdd: PropTypes.func,
  onClockSelected: PropTypes.func,
  onNextPreset: PropTypes.func,
  onRemove: PropTypes.func,
  selectedClockId: PropTypes.string,
  hideInactiveSegmentsOnDarkLCD: PropTypes.bool,
  style: PropTypes.object,
};

LCDClockDisplay.defaultProps = {
  preset: 0,
};

export default connect(
  // mapStateToProps
  (state, ownProps) => ({
    clocks: getClockIdsAndAbbreviations(state),
    preset: getPresetIndexForLCDDisplayById(state, ownProps.id),
    selectedClockId: getClockIdForLCDDisplayById(state, ownProps.id),
    hideInactiveSegmentsOnDarkLCD: shouldShowInactiveSegmentsOnDarkLCD(state),
  }),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    onClockSelected(clockId) {
      dispatch(setClockIdForClockDisplay({ clockId, id: ownProps.id }));
    },

    onNextPreset() {
      dispatch(cyclePreset(ownProps.id));
    },
  })
)(LCDClockDisplay);
