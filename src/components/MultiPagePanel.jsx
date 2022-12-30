import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

import FadeAndSlide from './transitions/FadeAndSlide';

const useStyles = makeStyles(
  () => ({
    page: {
      position: 'absolute',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    },
    scrollable: {
      overflow: 'auto',
    },
  }),
  {
    name: 'MultiPagePanel',
  }
);

/**
 * A single page in a multi-page panel component.
 */
export const Page = ({ id }) => id;

Page.propTypes = {
  children: PropTypes.node,
  id: PropTypes.string,
  keepMounted: PropTypes.bool,
  scrollable: PropTypes.bool,
};

/**
 * Controlled multi-page panel component that shows exactly one page out of
 * several. The panel must be placed in the layout in a way that its size can
 * be determined without looking at its children; in other words, its width and
 * height must either be fixed or pre-determined by its parents in the DOM.
 */
const MultiPagePanel = ({
  children,
  direction = 'left',
  onChange,
  selectedPage,
  ...rest
}) => {
  const classes = useStyles();

  return (
    <Box position='relative' {...rest}>
      {React.Children.map(children, (child) => {
        const { className, id, keepMounted, scrollable, ...boxProps } =
          child.props;
        const transitionProps = {
          in: id === selectedPage,
          direction,
          children: child.children,
        };
        if (!keepMounted) {
          transitionProps.mountOnEnter = true;
          transitionProps.unmountOnExit = true;
        }

        const effectiveClassName = clsx(
          classes.page,
          scrollable && classes.scrollable,
          className
        );
        return (
          <FadeAndSlide {...transitionProps}>
            <Box className={effectiveClassName} {...boxProps} />
          </FadeAndSlide>
        );
      })}
    </Box>
  );
};

MultiPagePanel.propTypes = {
  children: PropTypes.arrayOf(Page),
  direction: FadeAndSlide.propTypes?.direction,
  onChange: PropTypes.func,
  selectedPage: PropTypes.string,
};

export default MultiPagePanel;
