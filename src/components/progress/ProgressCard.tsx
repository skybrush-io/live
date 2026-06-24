import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import LinearProgress from '@mui/material/LinearProgress';
import Typography, { type TypographyProps } from '@mui/material/Typography';

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
   * The subheader of the progress card.
   */
  subheader?: React.ReactNode;

  /**
   * A potentially longer description to show.
   */
  description?: React.ReactNode;

  /**
   * The minimum height of the description text, usually in lh units.
   *
   * It should be used to avoid component height changes if the
   * description's length changes.
   *
   * Defaults to '2lh'.
   */
  descriptionMinHeight?: TypographyProps['minHeight'];

  /**
   * An optional icon to show next to the title.
   */
  icon?: React.ReactNode;
};

/**
 * Component that shows the progress of a long-running operation in a card.
 *
 * The card has a title (with an optional subheader), an optional longer description
 * and a progress bar at the bottom.
 */
const ProgressCard = ({
  description,
  icon,
  subheader,
  title,
  value,
}: Props) => (
  <Card elevation={3} sx={{ overflow: 'visible' }}>
    <CardHeader title={title} avatar={icon} subheader={subheader} />
    {description && (
      <CardContent sx={{ overflow: 'hidden', pt: 0 }}>
        <Typography variant='body2'>{description}</Typography>
      </CardContent>
    )}
    <LinearProgress
      value={value}
      variant='determinate'
      color={value >= 100 ? 'success' : 'primary'}
      sx={{ borderRadius: '0px 0px 4px 4px', height: 4 }}
    />
  </Card>
);

export default ProgressCard;
