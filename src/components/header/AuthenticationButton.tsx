import PersonIcon from '@mui/icons-material/Person';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { GenericHeaderButton } from '@skybrush/mui-components';

import AuthenticationStatusBadge from '~/components/badges/AuthenticationStatusBadge';
import {
  showAuthenticationDialog,
  showDeauthenticationDialog,
} from '~/features/servers/actions';
import {
  isAuthenticated,
  requiresAuthentication,
  supportsAuthentication,
} from '~/features/servers/selectors';
import type { RootState } from '~/store/reducers';

type Props = {
  isAuthenticated: boolean;
  isDisabled: boolean;
  onAuthenticate: () => void;
  onDeauthenticate: () => void;
};

const AuthenticationButtonPresentation = ({
  isAuthenticated,
  isDisabled,
  onAuthenticate,
  onDeauthenticate,
}: Props) => {
  const { t } = useTranslation();
  return (
    <GenericHeaderButton
      tooltip={t('authentication')}
      disabled={isDisabled}
      onClick={
        isDisabled
          ? undefined
          : isAuthenticated
            ? onDeauthenticate
            : onAuthenticate
      }
    >
      <AuthenticationStatusBadge />
      <PersonIcon />
    </GenericHeaderButton>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    isAuthenticated: isAuthenticated(state),
    isAuthRequired: requiresAuthentication(state),
    isDisabled: !supportsAuthentication(state),
  }),
  // mapDispatchToProps
  {
    onAuthenticate: () => showAuthenticationDialog(),
    onDeauthenticate: () => showDeauthenticationDialog(),
  }
)(AuthenticationButtonPresentation);
