import PropTypes from 'prop-types';
import React from 'react';
import { useAsyncRetry } from 'react-use';

import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Error from '@material-ui/icons/Error';
import Event from '@material-ui/icons/Event';
import Lock from '@material-ui/icons/Lock';
import Person from '@material-ui/icons/Person';
import Security from '@material-ui/icons/Security';
import Gift from '@material-ui/icons/CardGiftcard';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';
import LargeProgressIndicator from '@skybrush/mui-components/lib/LargeProgressIndicator';

import useMessageHub from '~/hooks/useMessageHub';
import { Divider } from '@material-ui/core';

const LicenseInfoPanelPresentation = ({
  expiryDate,
  features,
  id,
  licensee,
  restrictions,
}) => {
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
          <Security />
        </ListItemIcon>
        <ListItemText
          primary='License ID'
          secondary={id || 'No license activated'}
        />
      </ListItem>
      {licensee && (
        <ListItem disableGutters>
          <ListItemIcon>
            <Person />
          </ListItemIcon>
          <ListItemText primary='Name of license holder' secondary={licensee} />
        </ListItem>
      )}
      {id && (
        <ListItem disableGutters>
          <ListItemIcon>
            <Event />
          </ListItemIcon>
          <ListItemText
            primary='Expiry date'
            secondary={expiryDate || 'This license never expires'}
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

LicenseInfoPanelPresentation.propTypes = {
  id: PropTypes.string,
  licensee: PropTypes.string,
  expiryDate: PropTypes.string,
  features: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string,
      label: PropTypes.string,
      secondaryLabel: PropTypes.string,
    })
  ),
  restrictions: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string,
      label: PropTypes.string,
      secondaryLabel: PropTypes.string,
    })
  ),
};

const LicenseInfoPanel = () => {
  const messageHub = useMessageHub();
  const state = useAsyncRetry(messageHub.query.getLicenseInformation, [
    messageHub,
  ]);

  if (state.error && !state.loading) {
    return (
      <BackgroundHint
        icon={<Error />}
        text='Error while loading license information'
        button={<Button onClick={state.retry}>Try again</Button>}
      />
    );
  }

  if (state.value) {
    return <LicenseInfoPanelPresentation {...state.value} />;
  }

  return (
    <LargeProgressIndicator
      fullHeight
      label='Retrieving license information...'
    />
  );
};

export default LicenseInfoPanel;
