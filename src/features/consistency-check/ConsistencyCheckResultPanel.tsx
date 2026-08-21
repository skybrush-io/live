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
  StatusLightProps,
  StatusPill,
} from '@skybrush/mui-components';

import type { Identifier } from '~/utils/collections';
import { formatIdsAndTruncateTrailingItems } from '~/utils/formatting';

import { selectConsistencyCheckResults } from './selectors';

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
      <Box sx={{ width: 80 }}>
        <StatusPill status={isConsensus ? Status.SUCCESS : Status.WARNING}>
          {value}
        </StatusPill>
      </Box>
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

type ParameterAccordionProps = Readonly<{
  name: string;
  valueMap: Record<string, string[]>;
  majorityValue: string | undefined;
}>;

const useParameterAccordionStyles = makeStyles((theme) => ({
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
const ParameterAccordion = ({
  name,
  valueMap,
  majorityValue,
}: ParameterAccordionProps) => {
  const classes = useParameterAccordionStyles();
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
          <Typography component='span'>{name}</Typography>
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

// -- Consistency check result alert

const ConsistencyCheckResultSummary = (props: StatusLightProps) => {
  const { t } = useTranslation();
  const { errors, inconsistencies } = useSelector(
    selectConsistencyCheckResults
  );
  const errorCount = Object.keys(errors).length;
  const inconsistencyCount = Object.keys(inconsistencies).length;
  const status =
    errorCount > 0
      ? Status.ERROR
      : inconsistencyCount > 0
        ? Status.WARNING
        : Status.SUCCESS;
  const message =
    errorCount > 0
      ? t('consistencyCheck.result.errors', { count: errorCount })
      : inconsistencyCount > 0
        ? t('consistencyCheck.result.inconsistencies', {
            count: inconsistencyCount,
          })
        : t('consistencyCheck.result.consistent');
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <LabeledStatusLight status={status} {...props}>
        {message}
      </LabeledStatusLight>
    </Box>
  );
};

// -- Consistency check result panel

const useConsistencyCheckResultPanelStyles = makeStyles((theme) => ({
  root: {
    overflow: 'auto',
    maxHeight: 'calc(100vh - 320px)',
    margin: theme.spacing(0.5, 0, 0, 0),
  },
}));

const ConsistencyCheckResultPanel = () => {
  const { t } = useTranslation();
  const classes = useConsistencyCheckResultPanelStyles();
  const { majority, parameterMap } = useSelector(selectConsistencyCheckResults);

  const hasData = Object.keys(parameterMap).length > 0;
  if (!hasData) {
    return (
      <BackgroundHint
        sx={{ py: 1.5 }}
        text={t('uploadPanel.noJobResultAvailable')}
      />
    );
  }

  const sortedParams = Object.keys(parameterMap).sort();

  return (
    <Box className={classes.root}>
      <ConsistencyCheckResultSummary />
      {sortedParams.map((name) => (
        <ParameterAccordion
          key={name}
          name={name}
          valueMap={parameterMap[name]}
          majorityValue={majority[name]}
        />
      ))}
    </Box>
  );
};

export default ConsistencyCheckResultPanel;
