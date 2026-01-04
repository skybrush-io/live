import Security from '@mui/icons-material/Security';
import PropTypes from 'prop-types';
import { Translation } from 'react-i18next';
import { connect } from 'react-redux';

import { GenericHeaderButton } from '@skybrush/mui-components';

import GeofenceStatusBadge from '~/components/badges/GeofenceStatusBadge';
import { openSafetyDialog } from '~/features/safety/slice';

const SafetyButton = (props) => (
  <Translation>
    {(t) => (
      <GenericHeaderButton {...props} tooltip={t('safetyDialog.title')}>
        <GeofenceStatusBadge />
        <Security />
      </GenericHeaderButton>
    )}
  </Translation>
);

SafetyButton.propTypes = {
  onClick: PropTypes.func,
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  {
    onClick: openSafetyDialog,
  }
)(SafetyButton);
