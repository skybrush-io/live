import Box from '@mui/material/Box';
import identity from 'lodash-es/identity';
import isNil from 'lodash-es/isNil';
import { Fragment, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';
import { BackgroundHint } from '@skybrush/mui-components';

import type { RootState } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';
import { formatItemInterval } from '~/utils/formatting';

import { toggleUavsInWaitingQueue } from './actions';
import { JobScope } from './jobs';
import {
  getMissionIdFormatter,
  getScopeOfSelectedJobInUploadDialog,
  getUploadDialogIdList,
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

type RowData = {
  header: string;
  items: Identifier[];
  labels: string[];
};

type CreateRowsOptions = {
  columnCount: number;
  itemFormatter: (id: Identifier) => string;
  idFormatter: (id: Identifier) => string;
};

/**
 * Given a list of IDs to show in the upload status light grid, returns an
 * arrangement of IDs into rows.
 */
const createRowsFromIds = (
  mapping: Identifier[],
  { columnCount, itemFormatter, idFormatter }: CreateRowsOptions
): RowData[] => {
  const rows: RowData[] = [];
  const numberOfItems = mapping.length;

  for (let index = 0; index < numberOfItems; index += columnCount) {
    const items = mapping.slice(index, index + columnCount);
    const labels = items.map(itemFormatter);
    const header = `${formatItemInterval(items, idFormatter)} ▸`;
    rows.push({ header, items, labels });
  }

  return rows;
};

type UploadStatusLightsOwnProps = {
  columnCount?: number;
  itemFormatter?: (id: Identifier) => string;
};

type UploadStatusLightsStateProps = {
  idFormatter: (id: Identifier) => string;
  ids: Identifier[];
};

type UploadStatusLightsDispatchProps = {
  onHeaderClick: (uavIds: Identifier[]) => void;
};

type UploadStatusLightsProps = UploadStatusLightsOwnProps &
  UploadStatusLightsStateProps &
  UploadStatusLightsDispatchProps;

const UploadStatusLights = ({
  columnCount = NUMBER_OF_ITEMS_PER_ROW,
  idFormatter,
  ids,
  itemFormatter = identity,
  onHeaderClick,
}: UploadStatusLightsProps) => {
  const { t } = useTranslation();
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
        <Fragment key={header}>
          <UploadStatusRowHeader
            label={header}
            uavIds={items}
            onClick={onHeaderClick}
          />
          {items.map((itemId, index) =>
            isNil(itemId) ? (
              // eslint-disable-next-line @eslint-react/no-array-index-key
              <UploadStatusPill key={`__cell${index}`}>—</UploadStatusPill>
            ) : (
              <UploadStatusPill key={itemId} uavId={itemId}>
                {labels[index]}
              </UploadStatusPill>
            )
          )}
        </Fragment>
      ))}
    </Box>
  );
};

const ConnectedUploadStatusLights = connect(
  // mapStateToProps
  (state: RootState) => {
    const scope = getScopeOfSelectedJobInUploadDialog(state);
    const formatMissionId = getMissionIdFormatter(state);
    const scopedToMission = scope === JobScope.MISSION;

    return {
      ids: getUploadDialogIdList(state),
      idFormatter: scopedToMission ? formatMissionId : String,
    };
  },
  // mapDispatchToProps
  {
    onHeaderClick: toggleUavsInWaitingQueue,
  }
)(UploadStatusLights);

export default ConnectedUploadStatusLights;
