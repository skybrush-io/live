import parameterConsistencyCheckJobSpecification from '~/features/consistency-check/consistency-check';
import { CONSISTENCY_CHECK_JOB_TYPE } from '~/features/consistency-check/constants';
import firmwareCheckJobSpecification from '~/features/firmware-check/firmware-check';
import { FIRMWARE_CHECK_JOB_TYPE } from '~/features/firmware-check/constants';
import firmwareUploadJobSpecification from '~/features/firmware-update/upload';
import missionItemUploadJobSpecification from '~/features/mission/upload';
import parameterUploadJobSpecification from '~/features/parameters/upload';
import showUploadJobSpecification from '~/features/show/upload';
import { registerUploadJobType } from '~/features/upload/jobs';
import { registerUploadJobResultPanel } from '~/features/upload/result-panels';
import ValueConsistencyResultPanel from '~/features/upload-support/value-consistency/ValueConsistencyResultPanel';
import { tt } from '~/i18n';

function registerUploadJobTypes() {
  const specs = [
    firmwareUploadJobSpecification,
    parameterUploadJobSpecification,
    missionItemUploadJobSpecification,
    parameterConsistencyCheckJobSpecification,
    firmwareCheckJobSpecification,
    showUploadJobSpecification,
  ];
  const disposers = specs.map((spec) => registerUploadJobType(spec));
  disposers.push(
    registerUploadJobResultPanel(
      CONSISTENCY_CHECK_JOB_TYPE,
      ValueConsistencyResultPanel,
      {
        jobType: CONSISTENCY_CHECK_JOB_TYPE,
        messages: {
          consistent: tt('consistencyCheck.result.consistent'),
          errors: tt('consistencyCheck.result.errors'),
          inconsistencies: tt('consistencyCheck.result.inconsistencies'),
        },
      }
    ),
    registerUploadJobResultPanel(
      FIRMWARE_CHECK_JOB_TYPE,
      ValueConsistencyResultPanel,
      {
        jobType: FIRMWARE_CHECK_JOB_TYPE,
        messages: {
          consistent: tt('firmwareCheck.result.consistent'),
          errors: tt('firmwareCheck.result.errors'),
          inconsistencies: tt('firmwareCheck.result.inconsistencies'),
        },
      }
    )
  );

  disposers.reverse();

  return () => {
    for (const disposer of disposers) {
      disposer();
    }
  };
}

export default registerUploadJobTypes;
