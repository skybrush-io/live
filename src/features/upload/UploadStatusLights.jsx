import identity from 'lodash-es/identity';
import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';

import { getMissionMapping } from '~/features/mission/selectors';
import { getUAVIdList } from '~/features/uavs/selectors';
import { formatMissionIdRange } from '~/utils/formatting';

import { toggleUavsInWaitingQueue } from './actions';
import { JobScope } from './jobs';
import {
  getObjectIdsCompatibleWithSelectedJobInUploadDialog,
  getScopeOfSelectedJobInUploadDialog,
} from './selectors';
import UploadStatusPill from './UploadStatusPill';
import UploadStatusRowHeader from './UploadStatusRowHeader';

const NUMBER_OF_ITEMS_PER_ROW = 20;

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

  empty: {
    padding: theme.spacing(1, 0),
    height: 64,
  },
}));

/**
 * Default formatter used to create the row headings when the user specified
 * no formatter.
 */
const defaultRowHeaderFormatter = (_start, _end, items) => {
  if (items.length === 0) {
    return '—';
  } else if (items.length === 1) {
    return items[0];
  } else {
    return `${String(items[0])}-${String(items.at(-1))}`;
  }
};

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
      index + items.length,
      items
    )} ▸`;
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
  t,
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

  if (rows.length === 0) {
    return (
      <Box className={classes.empty}>
        <BackgroundHint text={t('uploadStatusLights.noAvailableUAVs')} />
      </Box>
    );
  }

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
              <UploadStatusPill key={`__cell${index}`}>—</UploadStatusPill>
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
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => {
    const scope = getScopeOfSelectedJobInUploadDialog(state);
    const scopedToCompatible = scope === JobScope.COMPATIBLE;
    const scopedToMission = scope === JobScope.MISSION;

    // prettier-ignore
    const idListSelector =
      scopedToCompatible ? getObjectIdsCompatibleWithSelectedJobInUploadDialog :
      scopedToMission ? getMissionMapping :
      getUAVIdList;

    return {
      ids: idListSelector(state),
      rowHeaderFormatter: scopedToMission
        ? formatMissionIdRange
        : defaultRowHeaderFormatter,
    };
  },
  // mapDispatchToProps
  {
    onHeaderClick: toggleUavsInWaitingQueue,
  }
)(withTranslation()(UploadStatusLights));
