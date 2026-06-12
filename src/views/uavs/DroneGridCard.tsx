import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import type { Theme } from '@mui/material/styles';
import clsx from 'clsx';
import React from 'react';

import { isThemeDark, makeStyles } from '@skybrush/app-theme-mui';

const accentColor = '#6eb6ff';

const useStyles = makeStyles((theme: Theme) => {
  const dark = isThemeDark(theme);

  return {
    card: {
      background: dark
        ? 'linear-gradient(160deg, rgba(28, 34, 44, 0.95) 0%, rgba(18, 21, 26, 0.98) 100%)'
        : theme.palette.background.paper,
      border: `1px solid ${dark ? 'rgba(255, 255, 255, 0.08)' : theme.palette.divider}`,
      borderRadius: theme.spacing(1.5),
      height: '100%',
      transition: theme.transitions.create(
        ['box-shadow', 'border-color', 'transform'],
        { duration: theme.transitions.duration.short }
      ),
    },

    cardHover: {
      '&:hover': {
        borderColor: dark ? 'rgba(110, 182, 255, 0.35)' : theme.palette.primary.light,
        boxShadow: dark
          ? '0 8px 24px rgba(0, 0, 0, 0.45)'
          : theme.shadows[4],
        transform: 'translateY(-2px)',
      },
    },

    cardSelected: {
      borderColor: `${accentColor} !important`,
      boxShadow: `0 0 0 1px rgba(110, 182, 255, 0.35), 0 10px 28px rgba(47, 128, 237, 0.22)`,
    },

    actionArea: {
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      justifyContent: 'center',
      padding: theme.spacing(1),
    },
  };
});

export type DroneGridCardProps = React.PropsWithChildren<
  Readonly<{
    className?: string;
    onClick?: () => void;
    selected?: boolean;
  }>
>;

const DroneGridCard = ({
  children,
  className,
  onClick,
  selected = false,
}: DroneGridCardProps): React.JSX.Element => {
  const classes = useStyles();

  return (
    <Card
      className={clsx(
        classes.card,
        onClick && classes.cardHover,
        selected && classes.cardSelected,
        className
      )}
      elevation={selected ? 4 : 0}
      variant='outlined'
    >
      {onClick ? (
        <CardActionArea className={classes.actionArea} onClick={onClick}>
          {children}
        </CardActionArea>
      ) : (
        <div className={classes.actionArea}>{children}</div>
      )}
    </Card>
  );
};

export default DroneGridCard;
