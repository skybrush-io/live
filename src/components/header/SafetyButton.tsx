import Security from '@mui/icons-material/Security';
import { Translation } from 'react-i18next';
import { connect } from 'react-redux';

import {
  GenericHeaderButton,
  type GenericHeaderButtonProps,
} from '@skybrush/mui-components';

import GeofenceStatusBadge from '~/components/badges/GeofenceStatusBadge';
import { openSafetyDialog } from '~/features/safety/slice';

type Props = GenericHeaderButtonProps;

const SafetyButton = (props: Props) => (
  <Translation>
    {(t) => (
      <GenericHeaderButton {...props} tooltip={t('safetyDialog.title')}>
        <GeofenceStatusBadge />
        <Security />
      </GenericHeaderButton>
    )}
  </Translation>
);

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  {
    onClick: openSafetyDialog,
  }
)(SafetyButton);
