import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import {
  createSecondaryAreaStyle,
  makeStyles,
  Status,
} from '@skybrush/app-theme-mui';
import {
  BackgroundHint,
  LabeledStatusLight,
  StatusPill,
} from '@skybrush/mui-components';

import type { Identifier } from '~/utils/collections';
import { formatIdsAndTruncateTrailingItems } from '~/utils/formatting';

import { selectParameterConsistencyCheckResults } from './selectors';
import { findMajority } from './utils';

// -- Parameter value grid row

type ParameterValueRowProps = Readonly<{
  value: string;
  uavIds: Identifier[];
  isConsensus: boolean;
}>;

const useParameterValueRowStyles = makeStyles((theme) => ({
  uavIds: {
    color: theme.palette.text.secondary,
  },
}));

/**
 * Renders a single row in the per-value breakdown grid.
 *
 * Returns a fragment of three components, fitting the wrapper CSS grid.
 */
const ParameterValueRow = ({
  value,
  uavIds,
  isConsensus,
}: ParameterValueRowProps) => {
  const classes = useParameterValueRowStyles();

  return (
    <>
      <StatusPill status={isConsensus ? Status.SUCCESS : Status.WARNING}>
        {value}
      </StatusPill>
      <StatusPill status={Status.OFF}>{uavIds.length}</StatusPill>
      <Typography className={classes.uavIds} variant='body2'>
        {formatIdsAndTruncateTrailingItems(uavIds.slice().sort())}
      </Typography>
    </>
  );
};

// -- Parameter value grid

type ParameterValueGridProps = Readonly<{
  valueMap: Record<string, string[]>;
  majorityValue: string | undefined;
}>;

const useParameterValueGridStyles = makeStyles((theme) => ({
  root: {
    display: 'grid',
    gridTemplateColumns: 'auto auto 1fr',
    gap: theme.spacing(1),
    paddingInline: theme.spacing(3),
  },
}));

/**
 * Renders the per-value breakdown for a single parameter as a grid.
 */
const ParameterValueGrid = ({
  valueMap,
  majorityValue,
}: ParameterValueGridProps) => {
  const classes = useParameterValueGridStyles();
  const sortedValues = Object.keys(valueMap).sort((a, b) => {
    if (a === majorityValue) {
      return -1;
    }
    if (b === majorityValue) {
      return 1;
    }
    return valueMap[b].length - valueMap[a].length;
  });

  return (
    <Box className={classes.root}>
      {sortedValues.map((value) => (
        <ParameterValueRow
          key={value}
          value={value}
          uavIds={valueMap[value]}
          isConsensus={value === majorityValue}
        />
      ))}
    </Box>
  );
};

// -- Parameter accordion

type ParameterAccordionItemProps = Readonly<{
  paramName: string;
  valueMap: Record<string, string[]>;
  majorityValue: string | undefined;
}>;

const useParameterAccordionItemStyles = makeStyles((theme) => ({
  accordionDetails: {
    ...createSecondaryAreaStyle(theme),
    padding: theme.spacing(1, 0),
    maxHeight: 300,
    overflowY: 'auto',
  },
  accordionSummaryStack: {
    width: '100%',
    flexDirection: 'row',
    gap: theme.spacing(1),
    paddingInline: theme.spacing(1),
  },
  statusStack: {
    flexDirection: 'row',
    gap: theme.spacing(2),
  },
  spacer: {
    flex: 1,
  },
}));

/**
 * Renders a single parameter as an expandable accordion with a per-value
 * breakdown in its details.
 */
const ParameterAccordionItem = ({
  paramName,
  valueMap,
  majorityValue,
}: ParameterAccordionItemProps) => {
  const classes = useParameterAccordionItemStyles();
  const consensusCount = majorityValue
    ? (valueMap[majorityValue]?.length ?? 0)
    : 0;
  const totalCount = Object.values(valueMap).reduce(
    (sum, ids) => sum + ids.length,
    0
  );
  const deviatingCount = totalCount - consensusCount;

  return (
    <Accordion disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack className={classes.accordionSummaryStack}>
          <Typography component='span'>{paramName}</Typography>
          <Box className={classes.spacer} />
          <Stack className={classes.statusStack}>
            <LabeledStatusLight status={Status.SUCCESS} size='small'>
              {consensusCount}
            </LabeledStatusLight>
            {deviatingCount > 0 && (
              <LabeledStatusLight status={Status.WARNING} size='small'>
                {deviatingCount}
              </LabeledStatusLight>
            )}
          </Stack>
        </Stack>
      </AccordionSummary>
      <AccordionDetails className={classes.accordionDetails}>
        <ParameterValueGrid valueMap={valueMap} majorityValue={majorityValue} />
      </AccordionDetails>
    </Accordion>
  );
};

// -- Error list

type ErrorListProps = Readonly<{
  errors: Record<Identifier, string>;
}>;

const useErrorListStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  entry: {
    display: 'flex',
    gap: theme.spacing(1),
  },
  uavId: {
    color: theme.palette.error.main,
    fontFamily: 'monospace',
  },
  errorMessage: {
    color: theme.palette.text.secondary,
  },
}));

/**
 * Renders the list of UAVs that produced errors during the consistency
 * check job.
 */
const ErrorList = ({ errors }: ErrorListProps) => {
  const { t } = useTranslation();
  const classes = useErrorListStyles();
  const entries = Object.entries(errors);

  if (entries.length === 0) {
    return null;
  }

  return (
    <Box className={classes.root}>
      <Typography variant='subtitle2' gutterBottom>
        {t('uploadPanel.consistencyCheck.errorsHeader')}
      </Typography>
      {entries
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([uavId, error]) => (
          <Box key={uavId} className={classes.entry}>
            <Typography className={classes.uavId}>{uavId}</Typography>
            <Typography className={classes.errorMessage}>{error}</Typography>
          </Box>
        ))}
    </Box>
  );
};

const useParameterConsistencyCheckResultPanelStyles = makeStyles((theme) => ({
  root: {
    overflow: 'auto',
    maxHeight: 'calc(100vh - 320px)',
    marginTop: theme.spacing(1),
  },
}));

const ParameterConsistencyCheckResultPanel = () => {
  const { t } = useTranslation();
  const classes = useParameterConsistencyCheckResultPanelStyles();
  const { parameterMap, errors } = useSelector(
    selectParameterConsistencyCheckResults
  );

  const hasData = Object.keys(parameterMap).length > 0;
  const hasErrors = Object.keys(errors).length > 0;

  if (!hasData && !hasErrors) {
    return <BackgroundHint text={t('uploadPanel.noJobResultAvailable')} />;
  }

  const majority = findMajority(parameterMap);
  const sortedParams = Object.keys(parameterMap).sort();

  return (
    <Box className={classes.root}>
      {sortedParams.map((paramName) => (
        <ParameterAccordionItem
          key={paramName}
          paramName={paramName}
          valueMap={parameterMap[paramName]}
          majorityValue={majority[paramName]}
        />
      ))}
      <ErrorList errors={errors} />
    </Box>
  );
};

export default ParameterConsistencyCheckResultPanel;
