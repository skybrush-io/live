import { Status } from '@skybrush/app-theme-mui';
import { LabeledStatusLight } from '@skybrush/mui-components';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { getOverallRTKStatus } from './selectors';
import { getSemanticsOfRTKStatus } from './utils';

const OverallRTKStatusLight = () => {
  const { t } = useTranslation();
  const status = useSelector(getOverallRTKStatus);

  return (
    <LabeledStatusLight status={getSemanticsOfRTKStatus(status) ?? Status.OFF}>
      {t('RTKSetupDialog.title')}
    </LabeledStatusLight>
  );
};

export default OverallRTKStatusLight;
