import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
// import { VariableSizeGrid as Grid } from 'react-window';

const getRowHeight = () => 20;

const VersionCheckGridCell = ({ columnIndex, rowIndex, style }) => (
  <div style={style}>foo</div>
);

const VersionCheckGrid = ({ components, height, width }) => {
  const getColumnWidth = useCallback((index) => (index === 0 ? 64 : 192), []);

  return null;
  /*
    <Grid
      columnCount={components.length + 1}
      columnWidth={getColumnWidth}
      rowCount={10}
      rowHeight={getRowHeight}
      width={width}
      height={height}
    >
      {VersionCheckGridCell}
    </Grid>
  );
  */
};

VersionCheckGrid.propTypes = {
  components: PropTypes.arrayOf(PropTypes.string),
  height: PropTypes.number,
  width: PropTypes.number,
};

export default connect(
  // mapStateToProps
  () => ({
    components: ['Autopilot', 'Companion computer', 'Hardware'],
  }),
  // mapDispatchToProps
  {}
)(VersionCheckGrid);
