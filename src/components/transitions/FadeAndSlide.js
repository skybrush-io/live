/**
 * @file Fade-and-slide transition.
 *
 * This is a copy of the Fade transition from Material-UI 4.9.3, with a few
 * style tweaks.
 */

import { useTheme } from '@mui/material/styles';
import { useForkRef } from '@mui/material/utils';
import PropTypes from 'prop-types';
import React from 'react';
import { Transition } from 'react-transition-group';

import { getTransitionProps, reflow } from './utils';

const transitionStyles = {
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
};

const defaultTimeout = {
  enter: 225, // TODO: this is the value from v4, upgrade
  exit: 195, // TODO: this is the value from v4, upgrade
};

const FadeAndSlide = React.forwardRef((props, ref) => {
  const {
    children,
    direction = 'up',
    in: inProp,
    onEnter,
    onExit,
    style,
    timeout = defaultTimeout,
    ...other
  } = props;
  const theme = useTheme();
  const handleRef = useForkRef(children.ref, ref);
  const transitionStyle = transitionStyles[direction];

  const handleEnter = (node, isAppearing) => {
    reflow(node); // So the animation always start from the start.

    const transitionProps = getTransitionProps(
      { style, timeout },
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
  };

  const handleExit = (node) => {
    const transitionProps = getTransitionProps(
      { style, timeout },
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
  };

  return (
    <Transition
      in={inProp}
      timeout={timeout}
      onEnter={handleEnter}
      onExit={handleExit}
      {...other}
    >
      {(state, childProps) => {
        return React.cloneElement(children, {
          style: {
            visibility: state === 'exited' && !inProp ? 'hidden' : undefined,
            ...transitionStyle[state],
            ...style,
            ...children.props.style,
          },
          ref: handleRef,
          ...childProps,
        });
      }}
    </Transition>
  );
});

FadeAndSlide.propTypes = {
  /**
   * A single child content element.
   */
  children: PropTypes.element,
  /**
   * The direction of the transition.
   */
  direction: PropTypes.oneOf(Object.keys(transitionStyles)),
  /**
   * If `true`, the component will transition in.
   */
  in: PropTypes.bool,
  /**
   * @ignore
   */
  onEnter: PropTypes.func,
  /**
   * @ignore
   */
  onExit: PropTypes.func,
  /**
   * @ignore
   */
  style: PropTypes.object,
  /**
   * The duration for the transition, in milliseconds.
   * You may specify a single timeout for all transitions, or individually with an object.
   */
  timeout: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({ enter: PropTypes.number, exit: PropTypes.number }),
  ]),
};

export default FadeAndSlide;
