import Color from 'color';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';

import Box from '@material-ui/core/Box';

require('~/../assets/css/dseg.css');

const variants = {
  default: {},

  '7segment': {
    fontFamily: 'DSEG7-Classic',
    allSegmentsChar: '8',
  },

  '14segment': {
    fontFamily: 'DSEG14-Classic',
    allSegmentsChar: '~',
  },
};

const offSegmentStyleBase = {
  position: 'absolute',
  left: 0,
  top: 0,
  opacity: 0.2,
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
          const glowSize = fontSize === undefined ? 4 : Math.round(fontSize);
          result.textShadow = `0 0 ${glowSize}px ${color || 'currentColor'}`;
          break;
        }

        case 'shadow': {
          const shadowOffset = fontSize === undefined || fontSize <= 16 ? 1 : 2;
          const shadowColor = new Color(color || 'black').alpha(0.3).string();
          result.textShadow = `${shadowOffset}px ${shadowOffset}px 0 ${shadowColor}`;
          break;
        }

        default:
          break;
      }
    }

    result.transition = 'color 150ms';

    return result;
  }, [color, decoration, height, off]);

  const offSegmentStyle = useMemo(() => {
    const fontSize = Math.floor(height * 0.7);
    return {
      ...offSegmentStyleBase,
      color: color || 'black',
      fontSize,
      height,
    };
  }, [color, height]);

  variant = variant || 'default';

  return (
    <Box
      position='relative'
      display='inline-block'
      fontFamily={variants[variant].fontFamily}
      {...rest}
    >
      {offSegments && variant !== 'default' && (
        <div style={offSegmentStyle}>
          {children.replace(/[^:. ]/g, variants[variant].allSegmentsChar || '')}
        </div>
      )}
      <div style={textStyle}>{children}</div>
    </Box>
  );
};

LCDText.propTypes = {
  children: PropTypes.node,
  color: PropTypes.string,
  decoration: PropTypes.oneOf(['plain', 'glow', 'shadow']),
  height: PropTypes.number,
  off: PropTypes.bool,
  offSegments: PropTypes.bool,
  variant: PropTypes.oneOf(['default', '7segment', '14segment']),
};

LCDText.defaultProps = {
  decoration: 'plain',
  variant: 'default',
};

export default LCDText;
