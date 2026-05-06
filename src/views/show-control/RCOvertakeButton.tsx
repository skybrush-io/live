import SportsEsports from '@mui/icons-material/SportsEsports';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { getRCOvertakeSettings } from '~/features/settings/selectors';
import { RCOvertakeInputSource } from '~/features/settings/types';
import { getSelectedUAVIds } from '~/features/uavs/selectors';
import messageHub from '~/message-hub';
import type { RootState } from '~/store/reducers';

const SEND_INTERVAL_MS = 50;
const MAX_CHANNEL_COUNT = 18;
const MIN_CHANNEL_COUNT = 4;
const AXIS_DEADBAND = 0.02;

const axisToChannel = (value: number): number => {
  const normalized = Math.abs(value) < AXIS_DEADBAND ? 0 : value;
  return Math.round(((Math.max(-1, Math.min(1, normalized)) + 1) / 2) * 65534);
};

const pwmToChannel = (value: number): number =>
  Math.round(((Math.max(1000, Math.min(2000, value)) - 1000) / 1000) * 65534);

const normalizeSerialChannels = (values: number[]): number[] => {
  const channels = values
    .filter((value) => Number.isFinite(value))
    .slice(0, MAX_CHANNEL_COUNT);
  const looksLikePwm = channels.every(
    (value) => value >= 800 && value <= 2200
  );

  return channels.map((value) =>
    looksLikePwm
      ? pwmToChannel(value)
      : Math.round(Math.max(0, Math.min(65535, value)))
  );
};

const parseSerialChannels = (line: string): number[] | undefined => {
  const trimmed = line.trim();

  if (!trimmed) {
    return;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const values = Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' &&
          parsed !== null &&
          'channels' in parsed &&
          Array.isArray((parsed as { channels?: unknown }).channels)
        ? (parsed as { channels: unknown[] }).channels
        : undefined;

    if (values) {
      return normalizeSerialChannels(values.map(Number));
    }
  } catch {
    // Fall through to CSV/whitespace parsing.
  }

  const values = trimmed
    .split(/[,\s;]+/)
    .map(Number)
    .filter((value) => Number.isFinite(value));

  return values.length > 0 ? normalizeSerialChannels(values) : undefined;
};

const getBestGamepad = (): Gamepad | undefined => {
  const pads = Array.from(navigator.getGamepads?.() ?? []).filter(
    (pad): pad is Gamepad => {
      if (!pad) {
        return false;
      }

      return (
        pad.axes.length >= 4 && !/keychron|keyboard|keypad/i.test(pad.id)
      );
    }
  );

  return (
    pads.find((pad) =>
      /radiomaster|boxer|tx16|zorro|edgetx|opentx/i.test(pad.id)
    ) ?? pads[0]
  );
};

const normalizeGamepadChannelList = (channels: number[]): number[] => {
  const result: number[] = [];

  for (const channel of channels) {
    if (
      Number.isInteger(channel) &&
      channel >= 1 &&
      channel <= MAX_CHANNEL_COUNT &&
      !result.includes(channel)
    ) {
      result.push(channel);
    }
  }

  return result.length > 0 ? result : [1, 2, 3, 4];
};

const createChannelsFromGamepad = (
  gamepad: Gamepad,
  gamepadChannels: number[]
): number[] => {
  const selectedChannels = normalizeGamepadChannelList(gamepadChannels);
  const channelCount = Math.max(
    MIN_CHANNEL_COUNT,
    Math.min(MAX_CHANNEL_COUNT, Math.max(...selectedChannels))
  );
  const channels = Array.from({ length: channelCount }, () => 65535);

  for (const [index, channel] of selectedChannels.entries()) {
    if (index >= gamepad.axes.length) {
      return channels;
    }
    channels[channel - 1] = axisToChannel(gamepad.axes[index]);
  }

  return channels;
};

const getSerialPortInfo = (port: any) =>
  port?.getInfo ? port.getInfo() : {};

const RCOvertakeButton = () => {
  const [enabled, setEnabled] = useState(false);
  const [inputName, setInputName] = useState<string>();
  const [error, setError] = useState<string>();
  const selectedUAVIds = useSelector((state: RootState) =>
    getSelectedUAVIds(state)
  );
  const rcOvertakeSettings = useSelector(getRCOvertakeSettings);
  const {
    gamepadChannels,
    inputSource,
    serialBaudRate,
    serialPortLabel,
    serialUsbProductId,
    serialUsbVendorId,
  } = rcOvertakeSettings;
  const targetUAVId =
    selectedUAVIds.length === 1 ? selectedUAVIds[0] : undefined;
  const enabledRef = useRef(false);
  const wasEnabledRef = useRef(false);
  const activeTargetRef = useRef<string>();
  const serialPortRef = useRef<any>();
  const serialReaderRef = useRef<any>();
  const serialStartPromiseRef = useRef<Promise<void>>();
  const serialChannelsRef = useRef<number[]>();
  const overtakeFrameInFlightRef = useRef(false);
  const overtakeAcknowledgedRef = useRef(false);

  const isSerialInput = inputSource === RCOvertakeInputSource.SERIAL;

  const closeSerialPort = useCallback(async () => {
    serialChannelsRef.current = undefined;
    serialStartPromiseRef.current = undefined;

    try {
      await serialReaderRef.current?.cancel?.();
    } catch {
      // Ignore cancellation errors during shutdown.
    }

    try {
      serialReaderRef.current?.releaseLock?.();
    } catch {
      // Ignore release errors during shutdown.
    }

    serialReaderRef.current = undefined;

    try {
      if (serialPortRef.current?.readable || serialPortRef.current?.writable) {
        await serialPortRef.current.close?.();
      }
    } catch {
      // Ignore close errors; a later open will report a usable error if needed.
    }

    serialPortRef.current = undefined;
  }, []);

  const startSerialReader = useCallback(async () => {
    if (serialStartPromiseRef.current) {
      await serialStartPromiseRef.current;
      return;
    }

    const serial = (navigator as any).serial ?? (navigator as any).webkitSerial;

    if (!serial?.getPorts) {
      throw new Error('Web Serial is not available');
    }

    serialStartPromiseRef.current = (async () => {
      const ports = await serial.getPorts();
      const selectedPort =
        ports.find((port: any) => {
          const info = getSerialPortInfo(port);
          return (
            info.usbVendorId === serialUsbVendorId &&
            info.usbProductId === serialUsbProductId
          );
        }) ?? ports[0];

      if (!selectedPort) {
        throw new Error('Select an RC COM port in Settings first');
      }

      serialPortRef.current = selectedPort;

      if (!selectedPort.readable) {
        await selectedPort.open({
          baudRate: serialBaudRate,
        });
      }

      setInputName(serialPortLabel ?? 'Selected COM port');

      const reader = selectedPort.readable.getReader();
      serialReaderRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (enabledRef.current && isSerialInput) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const channels = parseSerialChannels(line);

            if (channels && channels.length >= 4) {
              serialChannelsRef.current = channels;
              setError(undefined);
            }
          }
        }
      } finally {
        try {
          reader.releaseLock();
        } catch {
          // Ignore reader cleanup errors.
        }
      }
    })();

    try {
      await serialStartPromiseRef.current;
    } finally {
      serialStartPromiseRef.current = undefined;
    }
  }, [
    isSerialInput,
    serialBaudRate,
    serialPortLabel,
    serialUsbProductId,
    serialUsbVendorId,
  ]);

  const releaseOvertake = useCallback(
    async (uavId = targetUAVId) => {
      if (!uavId) {
        return;
      }

      try {
        await messageHub.execute.setRCOvertake({
          active: false,
          source: 'skybrush-live-radiomaster',
          uavId,
        });
      } catch (error) {
        console.error(error);
      }
    },
    [targetUAVId]
  );

  const sendOvertakeFrame = useCallback(async () => {
    if (overtakeFrameInFlightRef.current) {
      return;
    }

    if (!targetUAVId) {
      setError('Select exactly one drone');
      setEnabled(false);
      return;
    }

    let channels: number[] | undefined;

    if (isSerialInput) {
      void startSerialReader().catch((error) => {
        console.error(error);
        setError(error instanceof Error ? error.message : 'COM port failed');
        setEnabled(false);
      });

      channels = serialChannelsRef.current;
      if (!channels || channels.length < 4) {
        setError('Waiting for RC data on COM port');
        return;
      }
    } else {
      const gamepad = getBestGamepad();
      if (!gamepad) {
        setInputName(undefined);
        setError('No Radiomaster gamepad found');
        setEnabled(false);
        await releaseOvertake();
        return;
      }

      channels = createChannelsFromGamepad(gamepad, gamepadChannels);
      if (channels.length < 4) {
        setInputName(gamepad.id);
        setError('Gamepad must provide at least 4 channels');
        setEnabled(false);
        await releaseOvertake();
        return;
      }

      setInputName(gamepad.id);
      setError(undefined);
    }

    try {
      overtakeFrameInFlightRef.current = true;
      await messageHub.execute.setRCOvertake({
        active: true,
        channels,
        source: isSerialInput
          ? 'skybrush-live-serial-rc'
          : 'skybrush-live-radiomaster',
        uavId: targetUAVId,
        waitForAck: !overtakeAcknowledgedRef.current,
      });
      overtakeAcknowledgedRef.current = true;
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : 'RC overtake failed');
      setEnabled(false);
      await releaseOvertake();
    } finally {
      overtakeFrameInFlightRef.current = false;
    }
  }, [
    isSerialInput,
    gamepadChannels,
    releaseOvertake,
    startSerialReader,
    targetUAVId,
  ]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (enabled && !targetUAVId) {
      setEnabled(false);
      setError('Select exactly one drone');
    } else if (
      enabled &&
      activeTargetRef.current &&
      targetUAVId !== activeTargetRef.current
    ) {
      const previousTarget = activeTargetRef.current;
      wasEnabledRef.current = false;
      activeTargetRef.current = undefined;
      overtakeAcknowledgedRef.current = false;
      setEnabled(false);
      setError('RC overtake released because selection changed');
      void releaseOvertake(previousTarget);
    }
  }, [enabled, releaseOvertake, targetUAVId]);

  useEffect(() => {
    if (!enabled) {
      if (wasEnabledRef.current) {
        wasEnabledRef.current = false;
        activeTargetRef.current = undefined;
        overtakeAcknowledgedRef.current = false;
        void releaseOvertake();
      }
      if (isSerialInput) {
        void closeSerialPort();
      }
      return;
    }

    wasEnabledRef.current = true;
    activeTargetRef.current = targetUAVId;
    overtakeAcknowledgedRef.current = false;
    void sendOvertakeFrame();
    const timer = window.setInterval(() => {
      void sendOvertakeFrame();
    }, SEND_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
      void releaseOvertake(targetUAVId);
      if (isSerialInput) {
        void closeSerialPort();
      }
    };
  }, [
    closeSerialPort,
    enabled,
    isSerialInput,
    releaseOvertake,
    sendOvertakeFrame,
    targetUAVId,
  ]);

  useEffect(() => {
    if (enabled) {
      setEnabled(false);
      setError('RC overtake released because input settings changed');
    }
  }, [
    inputSource,
    gamepadChannels,
    serialBaudRate,
    serialUsbProductId,
    serialUsbVendorId,
  ]);

  useEffect(() => {
    const updateGamepad = () => {
      if (isSerialInput) {
        setInputName(serialPortLabel);
        return;
      }

      const gamepad = getBestGamepad();
      setInputName(gamepad?.id);
      if (gamepad) {
        setError(undefined);
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden && enabledRef.current) {
        setEnabled(false);
        void releaseOvertake();
      }
    };

    updateGamepad();
    window.addEventListener('gamepadconnected', updateGamepad);
    window.addEventListener('gamepaddisconnected', updateGamepad);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('gamepadconnected', updateGamepad);
      window.removeEventListener('gamepaddisconnected', updateGamepad);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (enabledRef.current) {
        void releaseOvertake();
      }
      void closeSerialPort();
    };
  }, [
    closeSerialPort,
    isSerialInput,
    serialPortLabel,
    releaseOvertake,
  ]);

  const label = useMemo(
    () => (enabled ? 'Release RC overtake' : 'RC overtake'),
    [enabled]
  );
  const selectionError =
    selectedUAVIds.length === 0
      ? 'Select one drone'
      : selectedUAVIds.length > 1
        ? 'Select only one drone'
        : undefined;

  const idleText = isSerialInput
    ? 'Select RC COM port in Settings'
    : 'Connect Radiomaster in USB joystick mode';

  return (
    <Box mx={0.5} my={1}>
      <Button
        fullWidth
        color={enabled ? 'error' : 'primary'}
        disabled={!targetUAVId}
        startIcon={<SportsEsports />}
        variant={enabled ? 'contained' : 'outlined'}
        onClick={() => setEnabled((value) => !value)}
      >
        {label}
      </Button>
      <Typography
        variant='caption'
        color={selectionError || error ? 'error' : 'textSecondary'}
      >
        {selectionError ??
          error ??
          (targetUAVId && inputName ? `${targetUAVId}: ${inputName}` : idleText)}
      </Typography>
    </Box>
  );
};

export default RCOvertakeButton;
