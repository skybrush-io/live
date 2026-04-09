import { Status } from '@skybrush/app-theme-mui';
import {
  LabeledStatusLight,
  type LabeledStatusLightProps,
} from '@skybrush/mui-components';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { getOverallRTKStatus } from './selectors';
import { describeRTKStatus, getSemanticsOfRTKStatus } from './utils';

type Props = Omit<LabeledStatusLightProps, 'children' | 'status'> & {
  format: 'short' | 'long';
};

const OverallRTKStatusLight = (props: Props) => {
  const { t } = useTranslation();
  const status = useSelector(getOverallRTKStatus);

  return (
    <LabeledStatusLight
      status={getSemanticsOfRTKStatus(status) ?? Status.OFF}
      {...props}
    >
      {describeRTKStatus(status, t)}
    </LabeledStatusLight>
  );
};

export default OverallRTKStatusLight;
