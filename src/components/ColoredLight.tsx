import Box, { type BoxProps } from '@mui/material/Box';
import clsx from 'clsx';

import { makeStyles } from '@skybrush/app-theme-mui';

const useStyles = makeStyles((theme) => ({
  root: {
    border: '1px solid rgba(0, 0, 0, 0.3)',
    borderRadius: '50%',
    color: 'black',
    height: '1em',
    minWidth:
      '1em' /* needed for narrow cases; setting width alone is not enough */,
    marginRight: theme.spacing(2),
    position: 'relative',
    width: '1em',
  },

  inline: {
    display: 'inline-block',
    marginRight: '0px !important',
    verticalAlign: 'sub',
  },

  'size-small': {
    fontSize: '0.75em',
  },

  'size-large': {
    fontSize: '1.25em',
  },
}));

type Size = 'small' | 'normal' | 'large';

type Props = Omit<BoxProps, 'children' | 'color'> & {
  color: string;
  inline?: boolean;
  size?: Size;
};

/**
 * Small component resembling an LED light that can be set to an arbitrary
 * color, with no semantic meaning.
 *
 * Use <code>StatusLight</code> for lights that do convey a semantic meaning
 * to ensure a uniform visual representation of the message semantics throughout
 * the app.
 */
const ColoredLight = ({
  color = '#000000',
  inline = false,
  size = 'normal',
  style,
  ...rest
}: Props) => {
  const classes = useStyles();

  return (
    <Box
      className={clsx(
        classes.root,
        inline && classes.inline,
        classes[`size-${size}` as keyof ReturnType<typeof useStyles>]
      )}
      component={inline ? 'span' : 'div'}
      style={{
        backgroundColor: color,
        ...style,
      }}
      {...rest}
    />
  );
};

export default ColoredLight;
