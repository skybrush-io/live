/**
 * @file Component that shows a three-dimensional view of the drone flock.
 */

import React, { useRef } from 'react';
import { connect } from 'react-redux';
import useResizeObserver from 'use-resize-observer';

import Box from '@material-ui/core/Box';

import ThreeDView from './ThreeDView';

const ThreeDTopLevelView = () => {
  const threeDViewRef = useRef(null);
  const { ref } = useResizeObserver({
    onResize() {
      if (threeDViewRef.current) {
        threeDViewRef.current.resize();
      }
    }
  });

  return (
    <Box ref={ref} position="relative">
      <ThreeDView ref={threeDViewRef} />
      <Box position="absolute" left={0} top={0} zIndex={1}>
        Three-D overlays come here
      </Box>
    </Box>
  );
};

export default connect(
  // mapStateToProps
  () => ({}),
  // mapDispatchToProps
  {}
)(ThreeDTopLevelView);
