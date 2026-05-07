import Box, { type BoxProps } from '@mui/material/Box';
import clsx from 'clsx';
import React from 'react';

import { makeStyles } from '@skybrush/app-theme-mui';

import FadeAndSlide, {
  type FadeAndSlideProps,
} from './transitions/FadeAndSlide';

const useStyles = makeStyles(() => ({
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
}));

type PageProps = BoxProps & {
  id: string;
  keepMounted?: boolean;
  scrollable?: boolean;
};

/**
 * A single page in a multi-page panel component.
 */
export const Page = ({ id }: PageProps) => id;

type MultiPagePanelProps = Omit<BoxProps, 'children'> & {
  children: Array<React.ReactElement<PageProps>>;
  direction?: React.ComponentProps<typeof FadeAndSlide>['direction'];
  onChange?: (newPageId: string) => void;
  selectedPage: string;
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
}: MultiPagePanelProps) => {
  const classes = useStyles();

  return (
    <Box
      {...rest}
      sx={[
        {
          position: 'relative',
        },
        ...(Array.isArray(rest.sx) ? rest.sx : [rest.sx]),
      ]}
    >
      {React.Children.map(children, (child) => {
        const {
          className,
          id,
          keepMounted,
          scrollable,
          ...boxProps
        }: PageProps = child.props;
        const transitionProps: FadeAndSlideProps = {
          in: id === selectedPage,
          direction,
          children: (child as any).children,
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

export default MultiPagePanel;
