import Box from '@mui/material/Box';
import React from 'react';

import Widget from '~/components/Widget';

import { mapOverlayShell } from '~/views/map/mapPanelStyles';

type MapToolbarsProps = Readonly<{
  left?: React.ReactNode;
  top?: React.ReactNode;
  topRight?: React.ReactNode;
  variant?: 'default' | 'skycontrol';
}>;

const overlayBase = {
  ...mapOverlayShell,
  pointerEvents: 'auto',
};

/**
 * Component that renders the toolbars of a map.
 */
const MapToolbars = ({
  left,
  top,
  topRight,
  variant = 'default',
}: MapToolbarsProps) => {
  if (variant === 'skycontrol') {
    return (
      <>
        {left ? (
          <Box
            sx={{
              ...overlayBase,
              '& .MuiDivider-root': {
                borderColor: 'rgba(255,255,255,0.12)',
                my: 0.25,
              },
              '& .MuiIconButton-root': {
                color: 'rgba(255,255,255,0.92)',
                height: 34,
                width: 34,

                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              },
              '& .MuiIconButton-root .MuiSvgIcon-root': {
                color: 'rgba(255,255,255,0.92)',
                fontSize: '1.1rem',
              },
              '& .MuiIconButton-colorPrimary .MuiSvgIcon-root': {
                color: '#6eb6ff',
              },
              bottom: 44,
              display: 'flex',
              flexDirection: 'column',
              left: 8,
              maxWidth: 44,
              overflowX: 'hidden',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              scrollbarColor: 'rgba(255,255,255,0.28) transparent',
              scrollbarWidth: 'thin',
              top: 72,

              '&::-webkit-scrollbar': {
                width: 4,
              },

              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(255,255,255,0.28)',
                borderRadius: 4,
              },
            }}
          >
            {left}
          </Box>
        ) : null}
        {top ? (
          <Box
            sx={{
              ...overlayBase,
              alignItems: 'center',
              color: 'rgba(255,255,255,0.92)',
              display: 'flex',
              flexDirection: 'row',
              gap: 0.25,
              left: 48,
              top: 8,

              '& .MuiIconButton-root': {
                color: 'rgba(255,255,255,0.92)',

                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              },

              '& .MuiSvgIcon-root': {
                color: 'rgba(255,255,255,0.92)',
              },

              '& .MuiInput-root': {
                color: 'rgba(255,255,255,0.92)',
              },

              '& .MuiInput-input': {
                color: 'rgba(255,255,255,0.92)',
                fontSize: '0.8rem',
                fontWeight: 600,
                textAlign: 'center',
              },

              '& .MuiInput-underline:before': {
                borderBottomColor: 'rgba(255,255,255,0.35)',
              },

              '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                borderBottomColor: 'rgba(255,255,255,0.55)',
              },

              '& .MuiInput-underline:after': {
                borderBottomColor: '#5ca0ff',
              },
            }}
          >
            {top}
          </Box>
        ) : null}
        {topRight ? (
          <Box
            sx={{
              ...overlayBase,
              display: 'flex',
              right: 8,
              top: 8,
            }}
          >
            {topRight}
          </Box>
        ) : null}
      </>
    );
  }

  return (
    <>
      {left ? (
        <Widget key='Widget.LeftToolbar' style={{ top: 8 + 48 + 8, left: 8 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>{left}</Box>
        </Widget>
      ) : null}
      {top ? (
        <Widget key='Widget.TopToolbar' style={{ top: 8, left: 8 + 24 + 8 }}>
          <Box sx={{ display: 'flex', flexDirection: 'row' }}>{top}</Box>
        </Widget>
      ) : null}
    </>
  );
};

export default MapToolbars;
