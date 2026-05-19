import clsx from 'clsx';
import React, { type CSSProperties, type ReactNode } from 'react';

import { Tooltip } from '@skybrush/mui-components';

export const FILLED_LIST_CELL_HEIGHT = 22;

export type FilledListCellProps = Readonly<{
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  title?: string;
  width?: number;
}>;

const baseCellStyle: CSSProperties = {
  boxSizing: 'border-box',
  display: 'inline-block',
  fontSize: 'small',
  fontWeight: 'bold',
  lineHeight: `${FILLED_LIST_CELL_HEIGHT}px`,
  minHeight: FILLED_LIST_CELL_HEIGHT,
  textAlign: 'center',
  textTransform: 'uppercase',
  userSelect: 'none',
  verticalAlign: 'top',
};

export const FilledListCell = ({
  children,
  className,
  style,
  title,
  width,
}: FilledListCellProps): React.JSX.Element => {
  const cell = (
    <span
      className={clsx(className)}
      style={{
        ...baseCellStyle,
        width,
        minWidth: width,
        ...style,
      }}
    >
      {children}
    </span>
  );

  return title ? <Tooltip content={title}>{cell}</Tooltip> : cell;
};

export type FilledListCellSegment = Readonly<{
  children: ReactNode;
  style?: CSSProperties;
  title?: string;
}>;

export type SplitFilledListCellProps = Readonly<{
  className?: string;
  segments: readonly FilledListCellSegment[];
  width?: number;
}>;

export const SplitFilledListCell = ({
  className,
  segments,
  width,
}: SplitFilledListCellProps): React.JSX.Element => (
  <span
    className={clsx(className)}
    style={{
      ...baseCellStyle,
      display: 'inline-flex',
      overflow: 'hidden',
      padding: 0,
      width,
      minWidth: width,
    }}
  >
    {segments.map((segment, index) => {
      const part = (
        <span
          key={index}
          style={{
            boxSizing: 'border-box',
            flex: '1 1 0',
            fontSize: 'small',
            fontWeight: 'bold',
            lineHeight: `${FILLED_LIST_CELL_HEIGHT}px`,
            minWidth: 0,
            overflow: 'hidden',
            textAlign: 'center',
            textOverflow: 'ellipsis',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            ...segment.style,
          }}
        >
          {segment.children}
        </span>
      );

      return segment.title ? (
        <Tooltip key={index} content={segment.title}>
          {part}
        </Tooltip>
      ) : (
        part
      );
    })}
  </span>
);

export default FilledListCell;
