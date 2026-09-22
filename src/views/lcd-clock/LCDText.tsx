import Box, { type BoxProps } from '@mui/material/Box';
import Color from 'color';
import type React from 'react';
import { useMemo } from 'react';
import '~/../assets/css/dseg.css';

type LCDTextVariant = 'default' | '7segment' | '14segment';

const variants: Record<
  LCDTextVariant,
  { allSegmentsChar?: string; fontFamily?: string }
> = {
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
  position: 'absolute' as const,
  left: 0,
  top: 0,
  opacity: 0.2,
};

export type LCDTextProps = Omit<BoxProps, 'color' | 'height' | 'variant'> & {
  color?: string;
  decoration?: 'plain' | 'glow' | 'shadow';
  height?: number;
  off?: boolean;
  offSegments?: boolean;
  variant?: LCDTextVariant;

  /**
   * Legacy system prop that used to be supported by MUI Box; it is forwarded
   * to the DOM element as-is to preserve the previous behavior.
   */
  p?: number;
};

/**
 * Component that shows some test using 14-segment LCD characters.
 */
const LCDText = ({
  children,
  color,
  decoration = 'plain',
  height,
  off,
  offSegments,
  variant = 'default',
  sx,
  ...rest
}: LCDTextProps) => {
  const textStyle = useMemo(() => {
    const fontSize =
      height === undefined ? undefined : Math.floor(height * 0.7);
    const result: {
      fontSize?: number;
      height?: number;
      color?: string;
      opacity?: number;
      textShadow?: string;
      transition?: string;
    } = { fontSize, height };

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

  const offSegmentStyle = useMemo<React.CSSProperties>(() => {
    const fontSize = height === undefined ? 0 : Math.floor(height * 0.7);
    return {
      ...offSegmentStyleBase,
      color: color || 'black',
      fontSize,
      height,
    };
  }, [color, height]);

  const variantProps = variants[variant];

  return (
    <Box
      {...rest}
      sx={{
        position: 'relative',
        display: 'inline-block',
        fontFamily: variantProps.fontFamily,
        ...sx,
      }}
    >
      {offSegments && variantProps.allSegmentsChar && (
        <div style={offSegmentStyle}>
          {typeof children === 'string'
            ? children.replace(/[^:. ]/g, variantProps.allSegmentsChar)
            : children}
        </div>
      )}
      <div style={textStyle}>{children}</div>
    </Box>
  );
};

export default LCDText;
