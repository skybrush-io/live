import BuildIcon from '@mui/icons-material/Build';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type React from 'react';
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
  Tooltip,
} from '@skybrush/mui-components';

import type { PreparedI18nKey, PreparedI18nRecord } from '~/i18n';
import { useAppDispatch } from '~/store/hooks';
import type { AppThunk, RootState } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';
import { formatIdsAndTruncateTrailingItems } from '~/utils/formatting';

import { collectValueFixes } from './analysis';
import { selectValueConsistencyResults } from './selectors';
import type { ValueFix } from './types';

// -- Types

/**
 * Prepared i18n keys for the result summary of a value-consistency panel.
 */
type ValueConsistencyMessages = Readonly<{
  consistent: PreparedI18nKey;
  errors: PreparedI18nKey;
  inconsistencies: PreparedI18nKey;
}>;

/**
 * Maybe partial translation record for names shown in the per-name breakdown.
 */
type TranslatedNames = Readonly<Record<string, string>>;

/**
 * Function that creates the thunk that applies the given fixes.
 */
type FixAction = (fixes: ValueFix[]) => AppThunk<unknown>;

// -- Fix button

type FixButtonProps = Readonly<{
  disabled?: boolean;
  label: string;
  onClick: () => void;
  tooltip: string;
}>;

/**
 * Small button that applies a fix, with the details in its tooltip.
 */
const FixButton = ({ disabled, label, onClick, tooltip }: FixButtonProps) => (
  <Tooltip content={tooltip}>
    {/* The wrapper keeps the tooltip working when the button is disabled */}
    <span>
      <Button
        disabled={disabled}
        size='small'
        startIcon={<BuildIcon />}
        onClick={onClick}
      >
        {label}
      </Button>
    </span>
  </Tooltip>
);

// -- Value grid row

type ValueRowProps = Readonly<{
  value: string;
  uavIds: Identifier[];
  isConsensus: boolean;
}>;

const useValueRowStyles = makeStyles((theme) => ({
  uavIds: {
    color: theme.palette.text.secondary,
  },
  valuePill: {
    textOverflow: 'ellipsis',
  },
}));

/**
 * Renders a single row in the per-value breakdown grid.
 *
 * Returns a fragment of three components, fitting the wrapper CSS grid.
 */
const ValueRow = ({ value, uavIds, isConsensus }: ValueRowProps) => {
  const classes = useValueRowStyles();

  return (
    /* Do not use a <Stack> below; it messes up the grid layout where the grid
     * assumes that there are 3 items in each row */
    <>
      <Tooltip content={value}>
        <Box sx={{ width: 80 }}>
          <StatusPill
            className={classes.valuePill}
            status={isConsensus ? Status.SUCCESS : Status.WARNING}
          >
            {value}
          </StatusPill>
        </Box>
      </Tooltip>
      <Box sx={{ width: 36 }}>
        <StatusPill status={Status.OFF}>{uavIds.length}</StatusPill>
      </Box>
      <Typography className={classes.uavIds} variant='body2'>
        {formatIdsAndTruncateTrailingItems(uavIds.slice().sort())}
      </Typography>
    </>
  );
};

// -- Value grid

type ValueGridProps = Readonly<{
  valueMap: Record<string, Identifier[]>;
  majorityValue: string | undefined;
}>;

const useValueGridStyles = makeStyles((theme) => ({
  root: {
    display: 'grid',
    gridTemplateColumns: 'auto auto 1fr',
    gap: theme.spacing(1),
    paddingInline: theme.spacing(3),
    flex: 1,
  },
}));

/**
 * Renders the per-value breakdown for a single name as a grid.
 */
const ValueGrid = ({ valueMap, majorityValue }: ValueGridProps) => {
  const classes = useValueGridStyles();
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
        <ValueRow
          key={value}
          value={value}
          uavIds={valueMap[value]}
          isConsensus={value === majorityValue}
        />
      ))}
    </Box>
  );
};

// -- Named-value accordion

type ValueAccordionProps = Readonly<{
  label: string;
  valueMap: Record<string, Identifier[]>;
  majorityValue: string | undefined;
  isTied: boolean;
  onFix?: () => void;
}>;

const useValueAccordionStyles = makeStyles((theme) => ({
  accordionDetails: {
    ...createSecondaryAreaStyle(theme),
    padding: theme.spacing(1, 0),
    maxHeight: 300,
    overflowY: 'auto',
  },
}));

/**
 * Renders a single (maybe raw, maybe translated) as an expandable accordion
 * with a per-value breakdown in its details.
 */
const ValueAccordion = ({
  label,
  valueMap,
  majorityValue,
  isTied,
  onFix,
}: ValueAccordionProps) => {
  const { t } = useTranslation();
  const classes = useValueAccordionStyles();
  const consensusCount =
    majorityValue !== undefined ? (valueMap[majorityValue]?.length ?? 0) : 0;
  const totalCount = Object.values(valueMap).reduce(
    (sum, ids) => sum + ids.length,
    0
  );
  const deviatingCount = totalCount - consensusCount;

  return (
    <Accordion disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction='row' gap={1} sx={{ width: '100%', px: 1 }}>
          <Typography component='span'>{label}</Typography>
          <Box sx={{ flex: 1 }} />
          <Stack gap={2} direction='row'>
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
        <ValueGrid valueMap={valueMap} majorityValue={majorityValue} />
        {onFix && deviatingCount > 0 && (
          <Stack direction='column' sx={{ paddingRight: 1 }}>
            <FixButton
              disabled={isTied}
              label={t('uploadPanel.fix')}
              tooltip={
                isTied
                  ? t('uploadPanel.noClearMajority')
                  : t('uploadPanel.fixDeviatingUAVs', {
                      count: deviatingCount,
                      value: majorityValue,
                    })
              }
              onClick={onFix}
            />
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

// -- Result summary

type ResultSummaryProps = Readonly<{
  errorCount: number;
  inconsistencyCount: number;
  messages: ValueConsistencyMessages;
  fixButton?: React.ReactNode;
}>;

const ResultSummary = ({
  errorCount,
  inconsistencyCount,
  messages,
  fixButton,
}: ResultSummaryProps) => {
  const { t } = useTranslation();
  const status =
    errorCount > 0
      ? Status.ERROR
      : inconsistencyCount > 0
        ? Status.WARNING
        : Status.SUCCESS;
  const message =
    errorCount > 0
      ? messages.errors(t)
      : inconsistencyCount > 0
        ? messages.inconsistencies(t)
        : messages.consistent(t);
  return (
    <Stack
      direction='row'
      sx={{ alignItems: 'center', gap: 1, pl: 3, pr: 2, py: fixButton ? 1 : 2 }}
    >
      <LabeledStatusLight status={status}>{message}</LabeledStatusLight>
      <Box sx={{ flex: 1 }} />
      {fixButton}
    </Stack>
  );
};

// -- Result panel

const useValueConsistencyResultPanelStyles = makeStyles((theme) => ({
  root: {
    overflow: 'auto',
    maxHeight: 'calc(100vh - 320px)',
    margin: theme.spacing(0.5, 0, 0, 0),
  },
}));

type ValueConsistencyResultPanelProps = Readonly<{
  jobType: string;
  messages: ValueConsistencyMessages;
  names?: PreparedI18nRecord;

  /**
   * Function that creates the thunk that sets the deviating values to the
   * majority value. Fix buttons are shown only if this is given.
   */
  fixAction?: FixAction;
}>;

const ValueConsistencyResultPanel = ({
  jobType,
  messages,
  names,
  fixAction,
}: ValueConsistencyResultPanelProps) => {
  const { t } = useTranslation();
  const classes = useValueConsistencyResultPanelStyles();
  const dispatch = useAppDispatch();
  const result = useSelector((state: RootState) =>
    selectValueConsistencyResults(state, jobType)
  );
  const { distribution, errors, inconsistencies, majority, tied } = result;
  const errorCount = Object.keys(errors).length;
  const inconsistencyCount = Object.keys(inconsistencies).length;

  const hasData = Object.keys(distribution).length > 0 || errorCount > 0;
  if (!hasData) {
    return (
      <BackgroundHint
        sx={{ py: 1.5 }}
        text={t('uploadPanel.noJobResultAvailable')}
      />
    );
  }

  // Applies the fixes for the given name, or for all names if omitted
  const fix = fixAction
    ? (name?: string) => {
        const fixes = collectValueFixes(result, name);
        if (fixes.length > 0) {
          void dispatch(fixAction(fixes));
        }
      }
    : undefined;

  let fixAllButton: React.ReactNode;
  if (fix && inconsistencyCount > 0) {
    const fixedUAVCount = new Set(
      collectValueFixes(result).flatMap(({ uavIds }) => uavIds)
    ).size;
    fixAllButton = (
      <FixButton
        disabled={fixedUAVCount === 0}
        label={t('uploadPanel.fixAll')}
        tooltip={
          fixedUAVCount === 0
            ? t('uploadPanel.noClearMajority')
            : t('uploadPanel.fixAllInconsistencies', { count: fixedUAVCount })
        }
        onClick={() => {
          fix();
        }}
      />
    );
  }

  const translatedNames: TranslatedNames | undefined = names?.(t);
  const rows = Object.entries(distribution)
    .map(([name, valueMap]) => ({
      name,
      label: translatedNames?.[name] ?? name,
      valueMap,
      majorityValue: majority[name],
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Box className={classes.root}>
      <ResultSummary
        errorCount={errorCount}
        inconsistencyCount={inconsistencyCount}
        messages={messages}
        fixButton={fixAllButton}
      />
      {rows.map(({ name, label, valueMap, majorityValue }) => (
        <ValueAccordion
          key={name}
          label={label}
          valueMap={valueMap}
          majorityValue={majorityValue}
          isTied={tied.includes(name)}
          onFix={
            fix
              ? () => {
                  fix(name);
                }
              : undefined
          }
        />
      ))}
    </Box>
  );
};

export default ValueConsistencyResultPanel;
