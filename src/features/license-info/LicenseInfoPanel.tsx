import Gift from '@mui/icons-material/CardGiftcard';
import Error from '@mui/icons-material/Error';
import Event from '@mui/icons-material/Event';
import Lock from '@mui/icons-material/Lock';
import Person from '@mui/icons-material/Person';
import VpnKey from '@mui/icons-material/VpnKey';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useTranslation } from 'react-i18next';
import { useAsyncRetry } from 'react-use';

import {
  BackgroundHint,
  LargeProgressIndicator,
} from '@skybrush/mui-components';

import useMessageHub from '~/hooks/useMessageHub';

type Props = {
  id?: string;
  licensee?: string;
  expiryDate?: string;
  features?: Array<{
    type: string;
    label: string;
    secondaryLabel?: string;
  }>;
  restrictions?: Array<{
    type: string;
    label: string;
    secondaryLabel?: string;
  }>;
};

const LicenseInfoPanelPresentation = ({
  expiryDate,
  features,
  id,
  licensee,
  restrictions,
}: Props) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'LicenseInfoPanel' });

  const featureItems = [];
  const restrictionItems = [];

  if (Array.isArray(features)) {
    for (const feature of features) {
      featureItems.push(
        <ListItem key={`${feature.type}_${feature.label}`} disableGutters>
          <ListItemIcon>
            <Gift />
          </ListItemIcon>
          <ListItemText
            primary={feature.label}
            secondary={feature.secondaryLabel}
          />
        </ListItem>
      );
    }
  }

  if (Array.isArray(restrictions)) {
    for (const restriction of restrictions) {
      restrictionItems.push(
        <ListItem
          key={`${restriction.type}_${restriction.label}`}
          disableGutters
        >
          <ListItemIcon>
            <Lock />
          </ListItemIcon>
          <ListItemText
            primary={restriction.label}
            secondary={restriction.secondaryLabel}
          />
        </ListItem>
      );
    }
  }

  return (
    <List dense disablePadding>
      <ListItem disableGutters>
        <ListItemIcon>
          <VpnKey />
        </ListItemIcon>
        <ListItemText
          primary={t('licenseId')}
          secondary={id ?? t('noLicenseActivated')}
        />
      </ListItem>
      {licensee && (
        <ListItem disableGutters>
          <ListItemIcon>
            <Person />
          </ListItemIcon>
          <ListItemText primary={t('licensee')} secondary={licensee} />
        </ListItem>
      )}
      {id && (
        <ListItem disableGutters>
          <ListItemIcon>
            <Event />
          </ListItemIcon>
          <ListItemText
            primary={t('expiryDate')}
            secondary={expiryDate ?? t('neverExpires')}
          />
        </ListItem>
      )}
      {featureItems.length > 0 && <Divider />}
      {featureItems}
      {restrictionItems.length > 0 && <Divider />}
      {restrictionItems}
    </List>
  );
};

const LicenseInfoPanel = () => {
  const { t } = useTranslation(undefined, { keyPrefix: 'LicenseInfoPanel' });

  const messageHub = useMessageHub();
  const state = useAsyncRetry(messageHub.query.getLicenseInformation, [
    messageHub,
  ]);

  if (state.error && !state.loading) {
    return (
      <BackgroundHint
        icon={<Error />}
        text={t('errorWhileLoading')}
        button={<Button onClick={state.retry}>{t('tryAgain')}</Button>}
      />
    );
  }

  if (state.value) {
    return <LicenseInfoPanelPresentation {...state.value} />;
  }

  return <LargeProgressIndicator fullHeight label={t('loading')} />;
};

export default LicenseInfoPanel;
