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
   * A potentially longer description to show.
   */
  description?: React.ReactNode;

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
  descriptionMinHeight?: TypographyProps['minHeight'];

  /**
   * An optional icon to show next to the title.
   */
  icon?: React.ReactNode;
};

const ProgressCard = (props: Props) => {
  const { caption, description, icon, title, value } = props;
  return (
    <Card elevation={3} sx={{ overflow: 'visible' }}>
      <CardHeader title={title} avatar={icon} subheader={caption} />
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
};

export default ProgressCard;
