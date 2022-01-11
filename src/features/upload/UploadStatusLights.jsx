import identity from 'lodash-es/identity';
import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

import { getMissionMapping } from '~/features/mission/selectors';
import { formatMissionIdRange } from '~/utils/formatting';

import { toggleUavsInWaitingQueue } from './actions';
import UploadStatusPill from './UploadStatusPill';
import UploadStatusRowHeader from './UploadStatusRowHeader';

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
}));

/**
 * Default formatter used to create the row headings when the user specified
 * no formatter.
 */
const defaultRowHeaderFormatter = (start, end) => `${start}-${end}`;

/**
 * Given a list of IDs to show in the upload status light grid, returns an
 * arrangement of IDs into rows.
 */
const createRowsFromIds = (
  mapping,
  { columnCount, itemFormatter, rowHeaderFormatter } = {}
) => {
  const rows = [];
  const numberOfItems = mapping.length;

  for (let index = 0; index < numberOfItems; index += columnCount) {
    const items = mapping.slice(index, index + columnCount);
    const labels = items.map(itemFormatter);
    const header = `${rowHeaderFormatter(
      index,
      index + items.length
    )} ${RIGHT_TRIANGLE}`;
    rows.push({ header, items, labels });
  }

  return rows;
};

/* eslint-disable react/no-array-index-key */
const UploadStatusLights = ({
  columnCount = NUMBER_OF_ITEMS_PER_ROW,
  ids,
  itemFormatter = identity,
  rowHeaderFormatter = defaultRowHeaderFormatter,
  onHeaderClick,
}) => {
  const classes = useStyles();
  const rows = useMemo(
    () =>
      createRowsFromIds(ids, {
        columnCount,
        itemFormatter,
        rowHeaderFormatter,
      }),
    [ids, columnCount, itemFormatter, rowHeaderFormatter]
  );

  return (
    <Box className={classes.root}>
      {rows.map(({ header, items, labels }) => (
        <React.Fragment key={header}>
          <UploadStatusRowHeader
            label={header}
            uavIds={items}
            onClick={onHeaderClick}
          />
          {items.map((itemId, index) =>
            isNil(itemId) ? (
              <UploadStatusPill key={`__cell${index}`}>
                {EM_DASH}
              </UploadStatusPill>
            ) : (
              <UploadStatusPill key={itemId} uavId={itemId}>
                {labels[index]}
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
  columnCount: PropTypes.number,
  itemFormatter: PropTypes.func,
  ids: PropTypes.arrayOf(PropTypes.string),
  onHeaderClick: PropTypes.func,
  rowHeaderFormatter: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    ids: getMissionMapping(state),
    rowHeaderFormatter: formatMissionIdRange,
  }),
  // mapDispatchToProps
  {
    onHeaderClick: toggleUavsInWaitingQueue,
  }
)(UploadStatusLights);
