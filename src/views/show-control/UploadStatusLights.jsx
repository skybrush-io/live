import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

import { getMissionMapping } from '~/features/mission/selectors';
import { formatMissionIdRange } from '~/utils/formatting';

import UploadStatusPill from './UploadStatusPill';

const NUMBER_OF_ITEMS_PER_ROW = 10;

const EM_DASH = '\u2014';
const RIGHT_TRIANGLE = '\u25B8';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'grid',
    gridTemplateColumns: `64px repeat(${NUMBER_OF_ITEMS_PER_ROW}, 1fr)`,
    padding: theme.spacing(1, 0),

    '& div': {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    },
  },

  rowHeader: {
    textAlign: 'right',
    padding: theme.spacing(0.5, 0),
    color: theme.palette.text.secondary,
  },
}));

const createRowsFromMapping = (mapping) => {
  const rows = [];
  const numberOfItems = mapping.length;

  for (let index = 0; index < numberOfItems; index += NUMBER_OF_ITEMS_PER_ROW) {
    const items = mapping.slice(index, index + NUMBER_OF_ITEMS_PER_ROW);
    const header = `${formatMissionIdRange(
      index,
      index + items.length
    )} ${RIGHT_TRIANGLE}`;
    rows.push({
      header,
      items,
    });
  }

  return rows;
};

/* eslint-disable react/no-array-index-key */
const UploadStatusLights = ({ mapping }) => {
  const classes = useStyles();
  const rows = useMemo(() => createRowsFromMapping(mapping), [mapping]);

  return (
    <Box className={classes.root}>
      {rows.map(({ header, items }) => (
        <React.Fragment key={header}>
          <div className={classes.rowHeader}>{header}</div>
          {items.map((uavId, index) =>
            isNil(uavId) ? (
              <UploadStatusPill key={`__cell${index}`}>
                {EM_DASH}
              </UploadStatusPill>
            ) : (
              <UploadStatusPill key={uavId} uavId={uavId}>
                {uavId}
              </UploadStatusPill>
            )
          )}
        </React.Fragment>
      ))}
    </Box>
  );
};
/* eslint-enable react/no-array-index-key */

UploadStatusLights.propTypes = {
  mapping: PropTypes.arrayOf(PropTypes.string),
};

export default connect(
  // mapStateToProps
  (state) => ({
    mapping: getMissionMapping(state),
  }),
  // mapDispatchToProps
  {}
)(UploadStatusLights);
