import Box, { type BoxProps } from '@mui/material/Box';

// TODO: This component is very similar to `BackgroundHint` from
//       `@skybrush/mui-components`, maybe extend and use that instead?
const CenteredBox = ({ sx, ...rest }: BoxProps) => (
  <Box
    sx={[
      {
        width: '100%',
        height: '100%',

        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',

        textAlign: 'center',
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    {...rest}
  />
);

export default CenteredBox;
