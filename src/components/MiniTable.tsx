import isNil from 'lodash-es/isNil';
import type React from 'react';

import { makeStyles } from '@skybrush/app-theme-mui';

const useStyles = makeStyles((theme) => ({
  root: {
    lineHeight: 'normal',
    fontSize: 'small',
    width: '100%',

    '& .muted': {
      color: theme.palette.text.disabled,
    },
  },

  header: {
    textTransform: 'uppercase',
    color: theme.palette.text.secondary,
  },

  value: {
    textAlign: 'right',
  },
}));

export const naText = <span className='muted'>—</span>;

export type MiniTableItem = string | [string, React.ReactNode];

type MiniTableProps = {
  items: MiniTableItem[];
};

const MiniTable = ({ items }: MiniTableProps) => {
  const classes = useStyles();

  return (
    <table className={classes.root}>
      <tbody>
        {items.map((row) =>
          Array.isArray(row) ? (
            <tr key={row[0]}>
              <td className={classes.header}>{row[0]}</td>
              <td className={classes.value}>
                {isNil(row[1]) ? naText : row[1]}
              </td>
            </tr>
          ) : (
            <tr key={row}>
              <td colSpan={2} />
            </tr>
          )
        )}
      </tbody>
    </table>
  );
};

export default MiniTable;
