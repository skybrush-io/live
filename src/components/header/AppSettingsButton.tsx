import SettingsIcon from '@mui/icons-material/Settings';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import {
  GenericHeaderButton,
  type GenericHeaderButtonProps,
} from '@skybrush/mui-components';

import { toggleAppSettingsDialog } from '~/features/settings/actions';

type Props = Omit<GenericHeaderButtonProps, 'children' | 'tooltip'>;

const AppSettingsButton = (props: Props) => {
  const { t } = useTranslation();

  return (
    <GenericHeaderButton {...props} tooltip={t('preferences')}>
      <SettingsIcon />
    </GenericHeaderButton>
  );
};

const ConnectedAppSettingsButton = connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  {
    onClick: toggleAppSettingsDialog,
  }
)(AppSettingsButton);

export default ConnectedAppSettingsButton;
