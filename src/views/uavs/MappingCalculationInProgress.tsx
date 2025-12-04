import { useTranslation } from 'react-i18next';

import { Status } from '@skybrush/app-theme-mui';
import {
  LabeledStatusLight,
  type StatusLightProps,
} from '@skybrush/mui-components';

const MappingCalculationInProgress = (
  props: Omit<StatusLightProps, 'status'>
) => {
  const { t } = useTranslation();
  return (
    <LabeledStatusLight status={Status.NEXT} {...props}>
      {t('mappingEditorToolbar.calculatingMapping')}
    </LabeledStatusLight>
  );
};

export default MappingCalculationInProgress;
