/* eslint-disable @typescript-eslint/no-unsafe-argument */

/**
 * @file Fade-and-slide transition.
 *
 * This is a copy of the Fade transition from Material-UI 4.9.3, with a few
 * style tweaks.
 */

import React from 'react';
import { Transition } from 'react-transition-group';
import type {
  EndListenerProps,
  EnterHandler,
  ExitHandler,
  TransitionActions,
  TransitionStatus,
} from 'react-transition-group/Transition.js';

import { duration, useTheme } from '@mui/material/styles';
import { useForkRef } from '@mui/material/utils';

import { getTransitionProps, reflow } from './utils.js';

type Direction = 'up' | 'down' | 'left' | 'right';

const transitionStyles: Record<
  Direction,
  Record<string, React.CSSProperties>
> = {
  up: {
    entering: {
      opacity: 1,
      transform: 'translateY(0)',
    },
    entered: {
      opacity: 1,
      transform: 'translateY(0)',
    },
    exiting: {
      opacity: 0,
      transform: 'translateY(-16px)',
    },
    exited: {
      opacity: 0,
      transform: 'translateY(16px)',
    },
  },

  down: {
    entering: {
      opacity: 1,
      transform: 'translateY(0)',
    },
    entered: {
      opacity: 1,
      transform: 'translateY(0)',
    },
    exiting: {
      opacity: 0,
      transform: 'translateY(16px)',
    },
    exited: {
      opacity: 0,
      transform: 'translateY(-16px)',
    },
  },

  left: {
    entering: {
      opacity: 1,
      transform: 'translateX(0)',
    },
    entered: {
      opacity: 1,
      transform: 'translateX(0)',
    },
    exiting: {
      opacity: 0,
      transform: 'translateX(-16px)',
    },
    exited: {
      opacity: 0,
      transform: 'translateX(16px)',
    },
  },

  right: {
    entering: {
      opacity: 1,
      transform: 'translateX(0)',
    },
    entered: {
      opacity: 1,
      transform: 'translateX(0)',
    },
    exiting: {
      opacity: 0,
      transform: 'translateX(16px)',
    },
    exited: {
      opacity: 0,
      transform: 'translateX(-16px)',
    },
  },
} as const;

const defaultTimeout = {
  enter: duration.enteringScreen,
  exit: duration.leavingScreen,
};

export type FadeAndSlideProps = {
  children: React.ReactElement;
  direction?: Direction;
  easing?: string | { enter: string; exit: string };
  in?: boolean;
  mountOnEnter?: boolean;
  unmountOnExit?: boolean;
  onEnter?: EnterHandler<undefined> | undefined;
  onEntering?: EnterHandler<undefined> | undefined;
  onEntered?: EnterHandler<undefined> | undefined;
  onExit?: ExitHandler<undefined> | undefined;
  onExiting?: ExitHandler<undefined> | undefined;
  onExited?: ExitHandler<undefined> | undefined;
  style?: React.CSSProperties;
  TransitionComponent?: typeof Transition;
} & EndListenerProps<undefined> &
  TransitionActions;

const FadeAndSlide = React.forwardRef(
  <T extends HTMLElement | undefined>(
    props: Omit<FadeAndSlideProps, 'ref'>,
    ref: React.Ref<T>
  ) => {
    const {
      addEndListener,
      appear = true,
      children,
      direction = 'up',
      easing,
      in: inProp,
      onEnter,
      onEntered,
      onEntering,
      onExit,
      onExited,
      onExiting,
      style,
      timeout = defaultTimeout,
      TransitionComponent = Transition,
      ...other
    } = props;
    const theme = useTheme();

    const enableStrictModeCompat = true;
    const nodeRef = React.useRef<HTMLElement | null>(null);
    const foreignRef: React.Ref<HTMLElement> = useForkRef(
      children.ref as React.Ref<T>,
      ref
    ) as any;
    const handleRef = useForkRef(nodeRef, foreignRef);
    const transitionStyle = transitionStyles[direction as Direction];

    const normalizedTransitionCallback =
      (callback?: (...args: any[]) => any) => (maybeIsAppearing?: boolean) => {
        if (callback) {
          const node = nodeRef.current;

          // onEnterXxx and onExitXxx callbacks have a different arguments.length value.
          if (maybeIsAppearing === undefined) {
            callback(node);
          } else {
            callback(node, maybeIsAppearing);
          }
        }
      };

    const handleEntering = normalizedTransitionCallback(onEntering);

    const handleEnter = normalizedTransitionCallback((node, isAppearing) => {
      reflow(node); // So the animation always start from the start.

      const transitionProps = getTransitionProps(
        { style, timeout, easing },
        {
          mode: 'enter',
        }
      );

      node.style.webkitTransition = theme.transitions.create(
        ['opacity', 'transform'],
        transitionProps
      );
      node.style.transition = theme.transitions.create(
        ['opacity', 'transform'],
        transitionProps
      );

      if (onEnter) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        onEnter(node, isAppearing);
      }
    });

    const handleEntered = normalizedTransitionCallback(onEntered);

    const handleExiting = normalizedTransitionCallback(onExiting);

    const handleExit = normalizedTransitionCallback((node) => {
      const transitionProps = getTransitionProps(
        { style, timeout, easing },
        {
          mode: 'exit',
        }
      );

      node.style.webkitTransition = theme.transitions.create(
        ['opacity', 'transform'],
        transitionProps
      );
      node.style.transition = theme.transitions.create(
        ['opacity', 'transform'],
        transitionProps
      );

      if (onExit) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        onExit(node);
      }
    });

    const handleExited = normalizedTransitionCallback(onExited);

    const handleAddEndListener = (next: () => void) => {
      if (addEndListener) {
        // Old call signature before `react-transition-group` implemented `nodeRef`
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        addEndListener(nodeRef.current as any, next);
      }
    };

    return React.createElement(
      TransitionComponent,
      {
        in: inProp,
        appear,
        timeout,
        nodeRef: enableStrictModeCompat ? nodeRef : undefined,
        onEnter: handleEnter,
        onEntered: handleEntered,
        onEntering: handleEntering,
        onExit: handleExit,
        onExited: handleExited,
        onExiting: handleExiting,
        addEndListener: handleAddEndListener,
        ...other,
      },
      ((state: TransitionStatus, childProps: any) => {
        return React.cloneElement(children, {
          style: {
            opacity: 0,
            visibility: state === 'exited' && !inProp ? 'hidden' : undefined,
            ...transitionStyle[state],
            ...style,
            ...children.props.style,
          },
          ref: handleRef,
          ...childProps,
        });
      }) as any
    );
  }
);
FadeAndSlide.displayName = 'FadeAndSlide';

export default FadeAndSlide;
