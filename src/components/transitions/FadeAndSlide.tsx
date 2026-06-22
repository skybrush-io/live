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

import { getTransitionProps, reflow } from './utils';

export type Direction = 'up' | 'down' | 'left' | 'right';

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

export type FadeAndSlideProps<T extends HTMLElement | undefined = undefined> = {
  children: React.ReactElement;
  direction?: Direction;
  easing?: string | { enter: string; exit: string };
  in?: boolean;
  mountOnEnter?: boolean;
  ref?: React.Ref<T>;
  unmountOnExit?: boolean;
  onEnter?: EnterHandler<T> | undefined;
  onEntering?: EnterHandler<T> | undefined;
  onEntered?: EnterHandler<T> | undefined;
  onExit?: ExitHandler<T> | undefined;
  onExiting?: ExitHandler<T> | undefined;
  onExited?: ExitHandler<T> | undefined;
  style?: React.CSSProperties;
  TransitionComponent?: typeof Transition;
} & Pick<EndListenerProps<T>, 'timeout'> &
  Partial<Pick<EndListenerProps<T>, 'addEndListener'>> &
  TransitionActions;

const FadeAndSlide = <T extends HTMLElement | undefined>({
  ref,
  ...props
}: FadeAndSlideProps<T>) => {
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
    (children as any).ref as React.Ref<T>,
    ref
  ) as any;
  const handleRef = useForkRef(nodeRef, foreignRef);
  const transitionStyle = transitionStyles[direction];

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
      onExit(node);
    }
  });

  const handleExited = normalizedTransitionCallback(onExited);

  const handleAddEndListener = (next: () => void) => {
    if (addEndListener) {
      // Old call signature before `react-transition-group` implemented `nodeRef`
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
      // eslint-disable-next-line @eslint-react/no-clone-element
      return React.cloneElement(children, {
        style: {
          opacity: 0,
          visibility: state === 'exited' && !inProp ? 'hidden' : undefined,
          ...transitionStyle[state],
          ...style,
          ...(children.props as any).style,
        },
        ref: handleRef,
        ...childProps,
      });
    }) as any
  );
};

FadeAndSlide.displayName = 'FadeAndSlide';

export default FadeAndSlide;
