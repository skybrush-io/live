import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

type Props = {
  /**
   * The current progress, must be in the [0, 100] interval,
   * just like in stock MUI progress indicators.
   */
  value: number;

  /**
   * The title of the progress card.
   */
  title: React.ReactNode;

  /**
   * A potentially longer description to show.
   */
  description: React.ReactNode;

  /**
   * Optional caption to show above the progress bar.
   */
  caption?: React.ReactNode;

  /**
   * The minimum height of the description text, usually in lh units.
   *
   * It should be used to avoid component height changes if the
   * description's length changes.
   *
   * Defaults to '2lh'.
   */
  descriptionMinHeight?: React.ComponentProps<typeof Typography>['minHeight'];

  /**
   * An optional icon to show next to the title.
   */
  icon?: React.ReactNode;
};

const ProgressCard = (props: Props) => {
  const {
    caption,
    description,
    descriptionMinHeight = '2lh',
    icon,
    title,
    value,
  } = props;
  return (
    <Paper
      elevation={4}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        pt: 2,
        px: 2,
        width: 'min(100%, 45ch)',
        textAlign: 'start',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon}
        <Typography variant='h6'>{title}</Typography>
      </Box>
      <Typography variant='body2' minHeight={descriptionMinHeight}>
        {description}
      </Typography>
      <Box>
        {caption && (
          <Typography variant='caption' textAlign='center'>
            {caption}
          </Typography>
        )}
        <LinearProgress
          value={value}
          variant='determinate'
          color={value >= 100 ? 'success' : 'primary'}
          sx={{ borderRadius: '0px 0px 4px 4px', height: 8, mx: -2 }}
        />
      </Box>
    </Paper>
  );
};

export default ProgressCard;
