import Box, { type BoxProps } from '@mui/material/Box';
import { useRef } from 'react';
import { useResizeObserver } from 'usehooks-ts';

/**
 * Container component for Chart.js charts that attempts to adapt the size of the chart
 * to the size of the component itself instead of requiring the user to specify the
 * width and height of the chart.
 *
 * This is achieved according to the guidelines in the Chart.js documentation: the
 * chart is placed in a container with `position: relative`; the chart then watches the
 * size changes of its parent component and redraws itself when the size of the parent
 * container changes.
 *
 * There's a reason why there are so many nesting levels in the implementation. It might
 * be possible to do this with a smaller number of divs, but if you plan to do that,
 * make sure to test these scenarios:
 *
 * - placing it in a top-level panel in the workbench and resizing the panel in
 *   arbitrary ways (growing and shrinking in both dimensions, resizing only in one
 *   dimension, etc.)
 * - adding padding on the chart container with `sx` to make sure that everything stays
 *   correctly aligned. Adding a padding only on the left side should not adjust the
 *   right side of the chart, for example.
 */
const ChartContainer = ({ children, sx, ...rest }: BoxProps) => {
  const measuredBoxRef = useRef<HTMLElement>(null);
  const { width = 0, height = 0 } = useResizeObserver({
    ref: measuredBoxRef as React.RefObject<HTMLElement>,
  });

  // TODO(ntamas): get paddings right!
  return (
    <Box ref={measuredBoxRef} {...rest} sx={{ position: 'relative', ...sx }}>
      <Box
        sx={{
          position: 'absolute',
          width,
          height,
          padding: 'inherit',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default ChartContainer;
