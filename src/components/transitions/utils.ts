import delay from 'delay';
import type React from 'react';

// @mui/material/transitions/utils is no longer part of the public API,
// but we need it, so we vendor it. Original source (as of 2025-10-01):
// https://github.com/mui/material-ui/blob/master/packages/mui-material/src/transitions/utils.ts
// Do not reexport it from the package. Ideally we should remove the vendored
// code in the future.

// --- Vendored part starts here. ------------------------------------------------------

export const reflow = (node: Element) => node.scrollTop;

type ComponentProps = {
  easing: string | { enter?: string; exit?: string } | undefined;
  style: React.CSSProperties | undefined;
  timeout: number | { enter?: number; exit?: number };
};

type Options = {
  mode: 'enter' | 'exit';
};

type TransitionProps = {
  duration: string | number;
  easing: string | undefined;
  delay: string | undefined;
};

export function getTransitionProps(
  props: ComponentProps,
  options: Options
): TransitionProps {
  const { timeout, easing, style = {} } = props;

  return {
    duration:
      style.transitionDuration ??
      (typeof timeout === 'number' ? timeout : timeout[options.mode] || 0),
    easing:
      style.transitionTimingFunction ??
      (typeof easing === 'object' ? easing[options.mode] : easing),
    delay: style.transitionDelay,
  };
}

// --- Vendored part ends here. ------------------------------------------------------

/**
 * Delay between closing a dialog and opening the next one, in milliseconds,
 * so the closing transition of the first dialog can finish.
 */
export const DIALOG_TRANSITION_DELAY = 150;

/**
 * Waits until the closing transition of a dialog finishes.
 */
export async function waitForDialogTransition(): Promise<void> {
  await delay(DIALOG_TRANSITION_DELAY);
}
