/**
 * @file Premiere-style timeline of boards.
 *
 * Each board is a block that can be:
 *   - clicked to select (Ctrl+click to multi-select)
 *   - dragged by the body to move along time
 *   - dragged by the left/right edge handles to trim / expand its duration
 *   - copied / pasted (buttons, or Ctrl+C / Ctrl+V while the timeline is focused)
 *
 * A scrubbable playhead and the compile + upload action live in the header.
 */

import Add from '@mui/icons-material/Add';
import CloudUpload from '@mui/icons-material/CloudUpload';
import ContentCopy from '@mui/icons-material/ContentCopy';
import ContentPaste from '@mui/icons-material/ContentPaste';
import Delete from '@mui/icons-material/Delete';
import ZoomIn from '@mui/icons-material/ZoomIn';
import ZoomOut from '@mui/icons-material/ZoomOut';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { exportAndUpload } from '~/features/led-editor/actions';
import {
  canExport,
  getActiveBoard,
  getBoardClipboard,
  getBoards,
  getPlayheadSec,
  getSelectedBoardIds,
  getTimelineDuration,
  getUploadStatus,
  hasTimelineOverlap,
} from '~/features/led-editor/selectors';
import {
  addBoard,
  copyBoards,
  pasteBoards,
  removeSelectedBoards,
  renameBoard,
  selectBoard,
  setBoardArrangement,
  setBoardTiming,
  setPlayhead,
  toggleBoardSelection,
} from '~/features/led-editor/slice';
import { type Board } from '~/features/led-editor/types';
import { rgbToCss } from '~/features/led-editor/utils';
import { type AppDispatch } from '~/store/reducers';

import NumberField from './NumberField';

const DEFAULT_PX_PER_SEC = 80;
const MIN_PX_PER_SEC = 6;
const MAX_PX_PER_SEC = 400;
const ZOOM_FACTOR = 1.5;
const TICK_STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
const TRACK_HEIGHT = 56;
const MIN_VIEW_SECONDS = 12;
const MIN_DURATION = 0.1;
const DRAG_THRESHOLD_PX = 3;
const HANDLE_WIDTH = 7;

type DragMode = 'move' | 'left' | 'right';

type DragState = {
  id: string;
  mode: DragMode;
  startX: number;
  originStart: number;
  originDuration: number;
  ctrl: boolean;
  moved: boolean;
};

const snap = (sec: number): number => Math.round(sec * 10) / 10;

/** A representative colour for a board's timeline block: its first lit bulb. */
const boardSwatch = (board: Board): string => {
  for (const drone of board.drones) {
    for (const pixel of drone) {
      if (pixel[0] !== 0 || pixel[1] !== 0 || pixel[2] !== 0) {
        return rgbToCss(pixel);
      }
    }
  }
  return rgbToCss([0, 0, 0]);
};

const Timeline = (): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const boards = useSelector(getBoards);
  const selectedIds = useSelector(getSelectedBoardIds);
  const activeBoard = useSelector(getActiveBoard);
  const duration = useSelector(getTimelineDuration);
  const playheadSec = useSelector(getPlayheadSec);
  const overlap = useSelector(hasTimelineOverlap);
  const upload = useSelector(getUploadStatus);
  const exportable = useSelector(canExport);
  const clipboard = useSelector(getBoardClipboard);

  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | undefined>(undefined);

  // Horizontal zoom: pixels per second. A ref mirrors it so the drag/scrub math
  // reads the latest value without re-creating the window listeners.
  const [pxPerSec, setPxPerSec] = useState(DEFAULT_PX_PER_SEC);
  const pxPerSecRef = useRef(pxPerSec);
  pxPerSecRef.current = pxPerSec;
  const zoomBy = useCallback((factor: number) => {
    setPxPerSec((p) =>
      Math.max(MIN_PX_PER_SEC, Math.min(MAX_PX_PER_SEC, p * factor))
    );
  }, []);

  // Inline board-name editing (double-click the label on a block).
  const [editing, setEditing] = useState<
    { id: string; name: string } | undefined
  >(undefined);

  const commitRename = useCallback(() => {
    if (editing && editing.name.trim()) {
      dispatch(renameBoard({ id: editing.id, name: editing.name.trim() }));
    }
    setEditing(undefined);
  }, [editing, dispatch]);

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      const d = drag.current;
      if (!d) {
        return;
      }
      const dx = event.clientX - d.startX;
      if (Math.abs(dx) > DRAG_THRESHOLD_PX) {
        d.moved = true;
      }
      const deltaSec = dx / pxPerSecRef.current;

      if (d.mode === 'move') {
        dispatch(
          setBoardTiming({
            id: d.id,
            startSec: snap(Math.max(0, d.originStart + deltaSec)),
          })
        );
      } else if (d.mode === 'right') {
        dispatch(
          setBoardTiming({
            id: d.id,
            durationSec: snap(
              Math.max(MIN_DURATION, d.originDuration + deltaSec)
            ),
          })
        );
      } else {
        // Left edge: move the start while keeping the right edge fixed.
        const originEnd = d.originStart + d.originDuration;
        const newStart = Math.max(
          0,
          Math.min(originEnd - MIN_DURATION, d.originStart + deltaSec)
        );
        dispatch(
          setBoardTiming({
            id: d.id,
            startSec: snap(newStart),
            durationSec: snap(originEnd - newStart),
          })
        );
      }
    },
    [dispatch]
  );

  const onMouseUp = useCallback(() => {
    const d = drag.current;
    if (d && !d.moved && d.mode === 'move') {
      // A click (not a drag): update selection.
      if (d.ctrl) {
        dispatch(toggleBoardSelection(d.id));
      } else {
        dispatch(selectBoard(d.id));
      }
    }
    drag.current = undefined;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }, [dispatch, onMouseMove]);

  const startDrag = useCallback(
    (
      event: React.MouseEvent,
      id: string,
      mode: DragMode,
      originStart: number,
      originDuration: number
    ) => {
      event.preventDefault();
      event.stopPropagation();
      drag.current = {
        id,
        mode,
        startX: event.clientX,
        originStart,
        originDuration,
        ctrl: event.ctrlKey || event.metaKey,
        moved: false,
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [onMouseMove, onMouseUp]
  );

  const onRulerClick = useCallback(
    (event: React.MouseEvent) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      dispatch(
        setPlayhead(
          Math.max(0, snap((event.clientX - rect.left) / pxPerSecRef.current))
        )
      );
    },
    [dispatch]
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 'c') {
        dispatch(copyBoards());
        event.preventDefault();
      } else if (key === 'v') {
        dispatch(pasteBoards());
        event.preventDefault();
      }
    },
    [dispatch]
  );

  const viewSeconds = Math.max(MIN_VIEW_SECONDS, Math.ceil(duration) + 4);
  const trackWidth = viewSeconds * pxPerSec;
  // Choose a tick spacing so labels keep ~55px apart at the current zoom.
  const tickStep =
    TICK_STEPS.find((s) => s * pxPerSec >= 55) ?? TICK_STEPS[TICK_STEPS.length - 1]!;
  const tickPx = tickStep * pxPerSec;
  const tickCount = Math.floor(viewSeconds / tickStep) + 1;
  const selectedSet = new Set(selectedIds);

  return (
    <Box
      tabIndex={0}
      onKeyDown={onKeyDown}
      sx={{ borderTop: '1px solid', borderColor: 'divider', p: 1, outline: 'none' }}
    >
      <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1 }}>
        <Button
          size='small'
          variant='outlined'
          startIcon={<Add />}
          onClick={() => dispatch(addBoard(undefined))}
        >
          New board
        </Button>
        <IconButton
          size='small'
          title='Copy selected boards (Ctrl+C)'
          disabled={selectedIds.length === 0}
          onClick={() => dispatch(copyBoards())}
        >
          <ContentCopy fontSize='small' />
        </IconButton>
        <IconButton
          size='small'
          title='Paste boards (Ctrl+V)'
          disabled={!clipboard}
          onClick={() => dispatch(pasteBoards())}
        >
          <ContentPaste fontSize='small' />
        </IconButton>

        {activeBoard && (
          <>
            <TextField
              size='small'
              label='Name'
              value={activeBoard.name}
              onChange={(event) =>
                dispatch(
                  renameBoard({ id: activeBoard.id, name: event.target.value })
                )
              }
              sx={{ width: 150 }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <NumberField
              label='Start (s)'
              value={activeBoard.startSec}
              width={96}
              onCommit={(value) =>
                dispatch(
                  setBoardTiming({ id: activeBoard.id, startSec: value })
                )
              }
            />
            <NumberField
              label='Duration (s)'
              value={activeBoard.durationSec}
              width={110}
              onCommit={(value) =>
                dispatch(
                  setBoardTiming({ id: activeBoard.id, durationSec: value })
                )
              }
            />
            <NumberField
              label='Rows'
              value={activeBoard.rows}
              width={80}
              onCommit={(value) =>
                dispatch(
                  setBoardArrangement({ id: activeBoard.id, rows: value })
                )
              }
            />
            <NumberField
              label='Cols'
              value={activeBoard.cols}
              width={80}
              onCommit={(value) =>
                dispatch(
                  setBoardArrangement({ id: activeBoard.id, cols: value })
                )
              }
            />
            <IconButton
              size='small'
              color='error'
              title='Remove selected board(s)'
              onClick={() => dispatch(removeSelectedBoards())}
            >
              <Delete fontSize='small' />
            </IconButton>
          </>
        )}

        <Box sx={{ flex: 1 }} />

        <IconButton
          size='small'
          title='Zoom out'
          disabled={pxPerSec <= MIN_PX_PER_SEC}
          onClick={() => zoomBy(1 / ZOOM_FACTOR)}
        >
          <ZoomOut fontSize='small' />
        </IconButton>
        <IconButton
          size='small'
          title='Zoom in'
          disabled={pxPerSec >= MAX_PX_PER_SEC}
          onClick={() => zoomBy(ZOOM_FACTOR)}
        >
          <ZoomIn fontSize='small' />
        </IconButton>
        <Typography
          variant='caption'
          color='text.secondary'
          title='Reset zoom'
          onClick={() => setPxPerSec(DEFAULT_PX_PER_SEC)}
          sx={{ cursor: 'pointer', minWidth: 56, textAlign: 'center' }}
        >
          {Math.round(pxPerSec)} px/s
        </Typography>

        {overlap && (
          <Typography variant='caption' color='error'>
            Boards overlap
          </Typography>
        )}
        {upload.state === 'error' && upload.message && (
          <Typography variant='caption' color='error'>
            {upload.message}
          </Typography>
        )}
        {upload.state === 'done' && upload.message && (
          <Typography variant='caption' color='success.main'>
            {upload.message}
          </Typography>
        )}
        <Button
          variant='contained'
          size='small'
          startIcon={<CloudUpload />}
          disabled={!exportable}
          onClick={() => dispatch(exportAndUpload())}
        >
          {upload.state === 'running' ? 'Uploading…' : 'Compile & upload'}
        </Button>
      </Stack>

      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ width: trackWidth, position: 'relative' }}>
          <Box
            ref={trackRef}
            onClick={onRulerClick}
            sx={{
              position: 'relative',
              height: 18,
              cursor: 'pointer',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            {Array.from({ length: tickCount }, (_unused, i) => {
              const sec = i * tickStep;
              return (
                <Box
                  key={sec}
                  sx={{
                    position: 'absolute',
                    left: sec * pxPerSec,
                    top: 0,
                    height: '100%',
                    borderLeft: '1px solid',
                    borderColor: 'divider',
                    pl: 0.5,
                  }}
                >
                  <Typography variant='caption' color='text.secondary'>
                    {sec}s
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <Box
            sx={{
              position: 'relative',
              height: TRACK_HEIGHT,
              background:
                'repeating-linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) ' +
                `${tickPx - 1}px, rgba(255,255,255,0.08) ${tickPx - 1}px, rgba(255,255,255,0.08) ${tickPx}px)`,
            }}
          >
            {boards.map((board) => {
              const left = board.startSec * pxPerSec;
              const width = Math.max(8, board.durationSec * pxPerSec);
              const selected = selectedSet.has(board.id);
              return (
                <Box
                  key={board.id}
                  onMouseDown={(event) =>
                    startDrag(
                      event,
                      board.id,
                      'move',
                      board.startSec,
                      board.durationSec
                    )
                  }
                  sx={{
                    position: 'absolute',
                    left,
                    top: 6,
                    width,
                    height: TRACK_HEIGHT - 12,
                    borderRadius: 1,
                    border: selected ? '2px solid #ffca28' : '1px solid #555',
                    background: '#37474f',
                    color: '#fff',
                    cursor: 'grab',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: `${HANDLE_WIDTH}px`,
                  }}
                >
                  {/* Left trim handle */}
                  <Box
                    onMouseDown={(event) =>
                      startDrag(
                        event,
                        board.id,
                        'left',
                        board.startSec,
                        board.durationSec
                      )
                    }
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: HANDLE_WIDTH,
                      height: '100%',
                      cursor: 'ew-resize',
                      background: 'rgba(255,255,255,0.18)',
                    }}
                  />
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '2px',
                      border: '1px solid rgba(255,255,255,0.4)',
                      flex: '0 0 auto',
                      background: boardSwatch(board),
                    }}
                  />
                  {editing?.id === board.id ? (
                    <Box
                      component='input'
                      autoFocus
                      value={editing.name}
                      onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditing({ id: board.id, name: e.target.value })
                      }
                      onBlur={commitRename}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          commitRename();
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setEditing(undefined);
                        }
                        e.stopPropagation();
                      }}
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        font: 'inherit',
                        color: '#fff',
                        background: 'rgba(0,0,0,0.35)',
                        border: '1px solid #ffca28',
                        borderRadius: '2px',
                        px: 0.5,
                        outline: 'none',
                      }}
                    />
                  ) : (
                    <Typography
                      variant='caption'
                      noWrap
                      title='Double-click to rename'
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditing({ id: board.id, name: board.name });
                      }}
                      sx={{ cursor: 'text', flex: 1, minWidth: 0 }}
                    >
                      {board.name}
                    </Typography>
                  )}
                  {/* Right trim handle */}
                  <Box
                    onMouseDown={(event) =>
                      startDrag(
                        event,
                        board.id,
                        'right',
                        board.startSec,
                        board.durationSec
                      )
                    }
                    sx={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      width: HANDLE_WIDTH,
                      height: '100%',
                      cursor: 'ew-resize',
                      background: 'rgba(255,255,255,0.18)',
                    }}
                  />
                </Box>
              );
            })}

            <Box
              sx={{
                position: 'absolute',
                left: playheadSec * pxPerSec,
                top: 0,
                height: '100%',
                width: '2px',
                background: '#29b6f6',
                pointerEvents: 'none',
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Timeline;
