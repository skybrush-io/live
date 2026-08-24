import TextField from '@mui/material/TextField';
import { type ChangeEvent, type KeyboardEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { shouldOptimizeUIForTouch } from '~/features/settings/selectors';

export type ParseableTextFieldChange<T> =
  { valid: false } | { valid: true; commit: boolean; value: T[] };

type Props<T> = {
  helperTextFallbackKey: string;
  labelKey: string;
  onChange?: (change: ParseableTextFieldChange<T>) => void;
  parse: (input: string) => T[];
  format: (items: T[]) => string;
};

/**
 * Multi-line text field that re-parses its contents on blur and reformats
 * them only on a successful parse, commits the parsed items on Shift+Enter,
 * and clears itself on a successful commit.
 */
const ParseableTextField = <T,>({
  helperTextFallbackKey,
  labelKey,
  onChange,
  parse,
  format,
}: Props<T>) => {
  const optimizeUIForTouch = useSelector(shouldOptimizeUIForTouch);
  const [parameterString, setParameterString] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setParameterString(event.target.value);
  };

  const validate = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    validateValue(event.target.value);
  };

  const validateValue = (value: string, commit = false) => {
    let parsed: T[];

    try {
      parsed = parse(value);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      onChange?.({ valid: false });
      return false;
    }

    setError('');
    onChange?.({ value: parsed, valid: true, commit });
    setParameterString(format(parsed));

    return true;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target;
    if (
      event.shiftKey &&
      event.key === 'Enter' &&
      (target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement)
    ) {
      if (validateValue(target.value, true)) {
        setParameterString('');
      }

      event.preventDefault();
    }
  };

  return (
    <TextField
      fullWidth
      multiline
      autoFocus={!optimizeUIForTouch}
      error={Boolean(error)}
      label={t(labelKey)}
      variant='filled'
      minRows={7}
      helperText={error || t(helperTextFallbackKey)}
      value={parameterString}
      onBlur={validate}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  );
};

export default ParseableTextField;
