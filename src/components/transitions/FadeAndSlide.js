/**
 * @file Fade-and-slide transition.
 *
 * This is a copy of the Fade transition from Material-UI 4.9.3, with a few
 * style tweaks.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Transition } from 'react-transition-group';
import { duration } from '@material-ui/core/styles/transitions';
import useTheme from '@material-ui/core/styles/useTheme';
import {
  reflow,
  getTransitionProps,
} from '@material-ui/core/transitions/utils';
import useForkRef from '@material-ui/core/utils/useForkRef';

const styles = {
  entering: {
    opacity: 1,
    transform: 'translateY(0)',
  },
  entered: {
    opacity: 1,
    transform: 'translateY(0)',
  },
  exiting: {
    transform: 'translateY(-16px)',
  },
};

const defaultTimeout = {
  enter: duration.enteringScreen,
  exit: duration.leavingScreen,
};

const FadeAndSlide = React.forwardRef((props, ref) => {
  const {
    children,
    in: inProp,
    onEnter,
    onExit,
    style,
    timeout = defaultTimeout,
    ...other
  } = props;
  const theme = useTheme();
  const handleRef = useForkRef(children.ref, ref);

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
      appear
      in={inProp}
      timeout={timeout}
      onEnter={handleEnter}
      onExit={handleExit}
      {...other}
    >
      {(state, childProps) => {
        return React.cloneElement(children, {
          style: {
            opacity: 0,
            transform: 'translateY(16px)',
            visibility: state === 'exited' && !inProp ? 'hidden' : undefined,
            ...styles[state],
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
