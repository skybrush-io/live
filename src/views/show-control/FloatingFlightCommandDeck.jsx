import Add from '@mui/icons-material/Add';
import DragIndicator from '@mui/icons-material/DragIndicator';
import Remove from '@mui/icons-material/Remove';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import PropTypes from 'prop-types';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { withTranslation } from 'react-i18next';

import { makeStyles } from '@skybrush/app-theme-mui';

import LargeControlButtonGroup from './LargeControlButtonGroup';

const PANEL_WIDTH = 300;
const VIEWPORT_MARGIN = 8;
const POSITION_STORAGE_KEY = 'skybrush:floatingFlightCommandDeckPosition';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const readSavedPosition = () => {
  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.x === 'number' &&
      typeof parsed?.y === 'number' &&
      Number.isFinite(parsed.x) &&
      Number.isFinite(parsed.y)
    ) {
      return { x: parsed.x, y: parsed.y };
    }
  } catch {
    // Ignore invalid persisted state.
  }

  return null;
};

const useStyles = makeStyles((theme) => ({
  root: {
    pointerEvents: 'auto',
    position: 'fixed',
    width: PANEL_WIDTH,
    zIndex: theme.zIndex.snackbar - 1,
  },

  panel: {
    overflow: 'hidden',
    width: PANEL_WIDTH,
  },

  header: {
    alignItems: 'center',
    cursor: 'grab',
    display: 'flex',
    gap: theme.spacing(0.25),
    justifyContent: 'space-between',
    minHeight: 28,
    padding: theme.spacing(0.25, 0.5, 0),
    touchAction: 'none',
    userSelect: 'none',

    '&:active': {
      cursor: 'grabbing',
    },
  },

  dragHandle: {
    alignItems: 'center',
    color: theme.palette.text.secondary,
    display: 'flex',
    flex: 1,
    gap: theme.spacing(0.5),
    minWidth: 0,
  },

  dragIcon: {
    fontSize: '1.1rem',
  },

  expandButton: {
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[8],

    '&:hover': {
      backgroundColor: theme.palette.background.paper,
    },
  },
}));

const FloatingFlightCommandDeck = ({ t }) => {
  const classes = useStyles();
  const rootRef = useRef(null);
  const dragStateRef = useRef({
    dragging: false,
    offsetX: 0,
    offsetY: 0,
  });

  const [collapsed, setCollapsed] = useState(false);
  const [position, setPosition] = useState(readSavedPosition);

  const clampToViewport = useCallback((nextX, nextY) => {
    const element = rootRef.current;
    const width = element?.offsetWidth ?? PANEL_WIDTH;
    const height = element?.offsetHeight ?? 120;
    const maxX = Math.max(
      VIEWPORT_MARGIN,
      window.innerWidth - width - VIEWPORT_MARGIN
    );
    const maxY = Math.max(
      VIEWPORT_MARGIN,
      window.innerHeight - height - VIEWPORT_MARGIN
    );

    return {
      x: clamp(nextX, VIEWPORT_MARGIN, maxX),
      y: clamp(nextY, VIEWPORT_MARGIN, maxY),
    };
  }, []);

  const placeDefaultPosition = useCallback(() => {
    const element = rootRef.current;
    if (!element) {
      return;
    }

    const margin = 16;
    setPosition(
      clampToViewport(
        window.innerWidth - element.offsetWidth - margin,
        window.innerHeight - element.offsetHeight - margin
      )
    );
  }, [clampToViewport]);

  useLayoutEffect(() => {
    if (position !== null) {
      return;
    }

    placeDefaultPosition();
  }, [collapsed, placeDefaultPosition, position]);

  useLayoutEffect(() => {
    if (position === null) {
      return;
    }

    setPosition((current) => {
      if (!current) {
        return current;
      }

      const clamped = clampToViewport(current.x, current.y);
      if (clamped.x === current.x && clamped.y === current.y) {
        return current;
      }

      return clamped;
    });
  }, [clampToViewport, collapsed]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((current) => {
        if (!current) {
          return current;
        }

        const clamped = clampToViewport(current.x, current.y);
        if (clamped.x === current.x && clamped.y === current.y) {
          return current;
        }

        return clamped;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampToViewport]);

  const persistPosition = useCallback((nextPosition) => {
    try {
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(nextPosition));
    } catch {
      // Ignore quota / privacy errors.
    }
  }, []);

  const handleDragStart = useCallback(
    (event) => {
      if (event.button !== 0 || !rootRef.current) {
        return;
      }

      const rect = rootRef.current.getBoundingClientRect();
      const current = position ?? {
        x: rect.left,
        y: rect.top,
      };

      if (position === null) {
        setPosition(current);
      }

      dragStateRef.current = {
        dragging: true,
        offsetX: event.clientX - current.x,
        offsetY: event.clientY - current.y,
      };

      event.preventDefault();
    },
    [position]
  );

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!dragStateRef.current.dragging) {
        return;
      }

      setPosition(
        clampToViewport(
          event.clientX - dragStateRef.current.offsetX,
          event.clientY - dragStateRef.current.offsetY
        )
      );
    };

    const handleMouseUp = () => {
      if (!dragStateRef.current.dragging) {
        return;
      }

      dragStateRef.current.dragging = false;

      setPosition((current) => {
        if (current) {
          persistPosition(current);
        }

        return current;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [clampToViewport, persistPosition]);

  const rootStyle =
    position === null
      ? { visibility: 'hidden' }
      : {
          left: position.x,
          top: position.y,
        };

  if (collapsed) {
    return (
      <Box
        ref={rootRef}
        className={classes.root}
        style={rootStyle}
        onMouseDown={handleDragStart}
      >
        <Tooltip title={t('largeControlButtonGroup.expandDeck')}>
          <IconButton
            aria-label={t('largeControlButtonGroup.expandDeck')}
            className={classes.expandButton}
            color='primary'
            onClick={() => setCollapsed(false)}
            onMouseDown={(event) => event.stopPropagation()}
            size='large'
          >
            <Add />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box ref={rootRef} className={classes.root} style={rootStyle}>
      <Paper className={classes.panel} elevation={8}>
        <Box className={classes.header} onMouseDown={handleDragStart}>
          <Box className={classes.dragHandle}>
            <DragIndicator className={classes.dragIcon} />
            <Box component='span' sx={{ fontSize: '0.7rem', opacity: 0.75 }}>
              {t('largeControlButtonGroup.dragDeck')}
            </Box>
          </Box>
          <Tooltip title={t('largeControlButtonGroup.collapseDeck')}>
            <IconButton
              aria-label={t('largeControlButtonGroup.collapseDeck')}
              onClick={() => setCollapsed(true)}
              onMouseDown={(event) => event.stopPropagation()}
              size='small'
            >
              <Remove />
            </IconButton>
          </Tooltip>
        </Box>
        <LargeControlButtonGroup />
      </Paper>
    </Box>
  );
};

FloatingFlightCommandDeck.propTypes = {
  t: PropTypes.func,
};

export default withTranslation()(FloatingFlightCommandDeck);
