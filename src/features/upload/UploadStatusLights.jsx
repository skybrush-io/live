import identity from 'lodash-es/identity';
import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';

import { toggleUavsInWaitingQueue } from './actions';
import { JobScope } from './jobs';
import {
  getMissionIdFormatter,
  getMissionMapping,
  getObjectIdsCompatibleWithSelectedJobInUploadDialog,
  getScopeOfSelectedJobInUploadDialog,
  getUAVIdList,
} from './selectors';
import UploadStatusPill from './UploadStatusPill';
import UploadStatusRowHeader from './UploadStatusRowHeader';

const HEADER_WIDTH = 92;
const NUMBER_OF_ITEMS_PER_ROW = 20;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'grid',
    gridTemplateColumns: `${HEADER_WIDTH}px repeat(${NUMBER_OF_ITEMS_PER_ROW}, 1fr)`,
    margin: theme.spacing(1, 0),

    '& div': {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    },

    // Make sure that the lights container itself becomes scrollable when
    // there are lots of drones instead of relying on the _dialog_ to become
    // scrollable.
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 320px)',
  },

  empty: {
    margin: theme.spacing(1, 0),
    height: 64,
  },
}));

const formatId = (id) => String(id);

/**
 * Returns the row header text for the given items.
 *
 * @param {Array} items  The array of items in the row.
 * @param {function} idFormatter  Function that formats IDs for the row header.
 */
const rowHeaderForItems = (items, idFormatter = formatId) => {
  if (items.length === 0) {
    return '—';
  } else if (items.length === 1) {
    return idFormatter(items[0]);
  } else {
    return `${idFormatter(items[0])}-${idFormatter(items.at(-1))}`;
  }
};

/**
 * Given a list of IDs to show in the upload status light grid, returns an
 * arrangement of IDs into rows.
 */
const createRowsFromIds = (
  mapping,
  { columnCount, itemFormatter, idFormatter } = {}
) => {
  const rows = [];
  const numberOfItems = mapping.length;

  for (let index = 0; index < numberOfItems; index += columnCount) {
    const items = mapping.slice(index, index + columnCount);
    const labels = items.map(itemFormatter);
    const header = `${rowHeaderForItems(items, idFormatter)} ▸`;
    rows.push({ header, items, labels });
  }

  return rows;
};

/* eslint-disable react/no-array-index-key */
const UploadStatusLights = ({
  columnCount = NUMBER_OF_ITEMS_PER_ROW,
  idFormatter,
  ids,
  itemFormatter = identity,
  onHeaderClick,
  t,
}) => {
  const classes = useStyles();
  const rows = useMemo(
    () =>
      createRowsFromIds(ids, {
        columnCount,
        itemFormatter,
        idFormatter,
      }),
    [ids, columnCount, itemFormatter, idFormatter]
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
  idFormatter: PropTypes.func,
  ids: PropTypes.arrayOf(PropTypes.string),
  onHeaderClick: PropTypes.func,
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => {
    const scope = getScopeOfSelectedJobInUploadDialog(state);
    const formatMissionId = getMissionIdFormatter(state);
    const scopedToCompatible = scope === JobScope.COMPATIBLE;
    const scopedToMission = scope === JobScope.MISSION;

    // prettier-ignore
    const idListSelector =
      scopedToCompatible ? getObjectIdsCompatibleWithSelectedJobInUploadDialog :
      scopedToMission ? getMissionMapping :
      getUAVIdList;

    return {
      ids: idListSelector(state),
      idFormatter: scopedToMission ? formatMissionId : formatId,
    };
  },
  // mapDispatchToProps
  {
    onHeaderClick: toggleUavsInWaitingQueue,
  }
)(withTranslation()(UploadStatusLights));
