import Restore from '@mui/icons-material/Restore';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { Tooltip } from '@skybrush/mui-components';

import ContentCopy from '~/icons/ContentCopy';

import {
  copyAntennaPositionToClipboard,
  toggleAntennaPositionFormat,
} from './actions';
import { getAntennaInfoSummary } from './selectors';

type Props = {
  hasSavedCoordinates: boolean;
  position?: string;
  onClick: () => void;
  onCopyAntennaPositionToClipboard?: () => void;
  onShowSavedCoordinates?: () => void;
};

const AntennaPositionIndicator = ({
  hasSavedCoordinates,
  onCopyAntennaPositionToClipboard,
  onClick,
  onShowSavedCoordinates,
  position,
}: Props) => {
  const { t } = useTranslation();
  const hasAntennaPosition = Boolean(position);

  return (
    <Box display='flex' alignItems='center' gap={0.5}>
      <Tooltip content={t('antennaPositionIndicator.clickToToggle')}>
        <Typography
          variant='body2'
          component='div'
          color={hasAntennaPosition ? 'textPrimary' : 'textSecondary'}
          style={{ cursor: 'pointer', textAlign: 'right' }}
          onClick={onClick}
        >
          {position || t('antennaPositionIndicator.antennaPositionNotKnown')}
        </Typography>
      </Tooltip>
      {onCopyAntennaPositionToClipboard && (
        <Tooltip content={t('antennaPositionIndicator.copyToClipboard')}>
          <IconButton
            disabled={!hasAntennaPosition}
            size='large'
            onClick={onCopyAntennaPositionToClipboard}
          >
            <ContentCopy />
          </IconButton>
        </Tooltip>
      )}
      {onShowSavedCoordinates && (
        <Tooltip
          content={t('antennaPositionIndicator.useSavedCoordinate')}
          // Explicitly set trigger to 'mouseenter' only to prevent the tooltip
          // from showing when the dialog closes and focus returns to this button.
          trigger='mouseenter'
        >
          <IconButton
            disabled={!hasSavedCoordinates}
            edge='end'
            size='large'
            onClick={onShowSavedCoordinates}
          >
            <Restore />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default connect(getAntennaInfoSummary, {
  onClick: toggleAntennaPositionFormat,
  onCopyAntennaPositionToClipboard: copyAntennaPositionToClipboard,
})(AntennaPositionIndicator);
