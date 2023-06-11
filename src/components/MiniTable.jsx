import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(
  (theme) => ({
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

    separator: {},
  }),
  {
    name: 'MiniTable',
  }
);

const naText = <span className='muted'>—</span>;

const MiniTable = ({ items }) => {
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
              <td className={classes.separator} colSpan={2} />
            </tr>
          )
        )}
      </tbody>
    </table>
  );
};

MiniTable.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.node)])
  ),
};

export default MiniTable;
