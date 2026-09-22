/**
 * @file React component that scans the system path and tries to find an
 * executable on the path. Provides feedback to the user about the state of
 * the scan.
 */

import ListItemText from '@mui/material/ListItemText';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import DialogHeaderListItem, {
  ICON_PRESETS,
} from '~/components/DialogHeaderListItem';
import { startLocalServerExecutableSearch } from '~/features/local-server/slice';
import type { RootState } from '~/store/reducers';

type Props = {
  error?: string;
  onRequestReload: () => void;
  result?: string;
  scanning: boolean;
};

const PathScannerPresentation = ({
  error,
  onRequestReload,
  result,
  scanning,
}: Props) => {
  const { t } = useTranslation(undefined, {
    keyPrefix: 'PathScanner',
  });
  return (
    <DialogHeaderListItem onClick={onRequestReload}>
      {scanning
        ? ICON_PRESETS.inProgress
        : error
          ? ICON_PRESETS.error
          : result
            ? ICON_PRESETS.success
            : ICON_PRESETS.warning}
      <ListItemText
        primary={
          error ||
          (result ? t('success') : scanning ? t('scanning') : t('notFound'))
        }
        secondary={scanning ? t('scanningSecondary') : result || t('scanAgain')}
      />
    </DialogHeaderListItem>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    ...state.localServer.pathScan,
  }),
  // mapDispatchToProps
  {
    onRequestReload: startLocalServerExecutableSearch,
  }
)(PathScannerPresentation);
