/**
 * @file A small numeric text field that may be cleared while editing.
 *
 * MUI controlled number inputs bound directly to a clamped value snap back to
 * the minimum the moment you delete the last digit, so you can never clear the
 * field to retype it. This wrapper keeps the raw text locally: it commits a
 * parsed number only when the text is a valid number, leaves the field empty
 * while you type, and normalises back to the committed value on blur.
 */

import TextField from '@mui/material/TextField';
import React, { useEffect, useRef, useState } from 'react';

type NumberFieldProps = {
  label: string;
  value: number;
  onCommit: (value: number) => void;
  width?: number;
};

const NumberField = ({
  label,
  value,
  onCommit,
  width = 110,
}: NumberFieldProps): JSX.Element => {
  const [text, setText] = useState<string>(String(value));
  const focused = useRef(false);

  // Sync from the external value unless the user is mid-edit.
  useEffect(() => {
    if (!focused.current) {
      setText(String(value));
    }
  }, [value]);

  return (
    <TextField
      size='small'
      type='number'
      label={label}
      value={text}
      onFocus={() => {
        focused.current = true;
      }}
      onChange={(event) => {
        const next = event.target.value;
        setText(next); // allow empty / partial input
        if (next.trim() !== '') {
          const parsed = Number(next);
          if (Number.isFinite(parsed)) {
            onCommit(parsed);
          }
        }
      }}
      onBlur={() => {
        focused.current = false;
        setText(String(value)); // revert empty / show the committed (clamped) value
      }}
      sx={{ width }}
      slotProps={{ inputLabel: { shrink: true } }}
    />
  );
};

export default NumberField;
