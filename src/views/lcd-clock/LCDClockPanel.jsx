import clsx from 'clsx';
import Color from 'color';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import { useMeasure } from 'react-use';

import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

require('~/../assets/css/dseg.css');

const variants = {
  default: {},

  '7segment': {
    fontFamily: "'DSEG7-Classic'",
    allSegmentsChar: '8'
  },

  '14segment': {
    fontFamily: "'DSEG14-Classic'",
    allSegmentsChar: '~'
  }
};

const offSegmentStyleBase = {
  position: 'absolute',
  left: 0,
  top: 0,
  opacity: 0.2
};

/**
 * Component that shows some test using 14-segment LCD characters.
 */
const LCDText = ({
  children,
  color,
  decoration,
  height,
  off,
  offSegments,
  variant,
  ...rest
}) => {
  const textStyle = useMemo(() => {
    const fontSize =
      height === undefined ? undefined : Math.floor(height * 0.7);
    const result = { fontSize, height };

    if (color !== undefined) {
      result.color = color;
    }

    if (off) {
      result.opacity = 0.3;
    }

    if (!off) {
      switch (decoration) {
        case 'glow': {
          const glowSize =
            fontSize === undefined ? 4 : Math.round(Math.max(2, fontSize / 4));
          result.textShadow = `0 0 ${glowSize}px ${color || 'currentColor'}`;
          break;
        }

        case 'shadow': {
          const shadowOffset =
            fontSize === undefined
              ? 2
              : Math.round(Math.min(Math.max(2, fontSize / 8), 4));
          const shadowColor = new Color(color || 'black').alpha(0.3).string();
          result.textShadow = `${shadowOffset}px ${shadowOffset}px 0 ${shadowColor}`;
          break;
        }

        default:
          break;
      }
    }

    return result;
  }, [color, decoration, height, off]);

  const offSegmentStyle = useMemo(() => {
    const fontSize = Math.floor(height * 0.7);
    return {
      ...offSegmentStyleBase,
      color: color || 'black',
      fontSize,
      height
    };
  }, [color, height]);

  variant = variant || 'default';

  return (
    <Box
      position="relative"
      display="inline-block"
      fontFamily={variants[variant].fontFamily}
      {...rest}
    >
      {offSegments && variant !== 'default' && (
        <div style={offSegmentStyle}>
          {children.replace(/[^:.]/g, variants[variant].allSegmentsChar || '')}
        </div>
      )}
      <div style={textStyle}>{children}</div>
    </Box>
  );
};

LCDText.propTypes = {
  children: PropTypes.string,
  color: PropTypes.string,
  decoration: PropTypes.oneOf(['plain', 'glow', 'shadow']),
  height: PropTypes.number,
  off: PropTypes.bool,
  offSegments: PropTypes.bool,
  variant: PropTypes.oneOf(['default', '7segment', '14segment'])
};

LCDText.defaultProps = {
  decoration: 'plain',
  variant: 'default'
};

const useStyles = makeStyles(
  theme => ({
    root: {
      background: 'black',
      /*
      backgroundImage:
        'url(data:image/png;base64,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);',
      backgroundColor: 'rgb(149, 177, 89)',
      */
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      position: 'relative',
      userSelect: 'none'
    },

    offSegments: {
      position: 'absolute',
      top: 0,
      left: 0,
      opacity: 0.3
    }
  }),
  { name: 'LCDClockPanel' }
);

/**
 * Panel that shows the status of a clock in the style of a classic
 * 7-segment LCD display.
 */
const LCDClockPanel = () => {
  const classes = useStyles();
  const [ref, { height }] = useMeasure();

  return (
    <Box className={clsx(classes.root)}>
      <Box display="flex" flexDirection="row">
        <LCDText offSegments color="red" decoration="glow" p={0.5}>
          MTC
        </LCDText>
        <LCDText offSegments off color="red" decoration="glow" p={0.5}>
          TIME
        </LCDText>
      </Box>
      <Box ref={ref} flex={1} overflow="hidden">
        <LCDText
          offSegments
          height={height}
          color="red"
          decoration="glow"
          variant="7segment"
        >
          00:17:41
        </LCDText>
      </Box>
    </Box>
  );
};

LCDClockPanel.propTypes = {};

LCDClockPanel.defaultProps = {};

export default connect(
  // mapStateToProps
  state => ({}),
  // mapDispatchToProps
  null
)(LCDClockPanel);
