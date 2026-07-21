import { CONSISTENCY_CHECK_JOB_TYPE } from '~/features/parameters/constants';
import ParameterConsistencyCheckResultPanel from '~/features/parameters/ParameterConsistencyCheckResultPanel';
import firmwareUploadJobSpecification from '~/features/firmware-update/upload';
import missionItemUploadJobSpecification from '~/features/mission/upload';
import parameterConsistencyCheckJobSpecification from '~/features/parameters/consistency-check';
import parameterUploadJobSpecification from '~/features/parameters/upload';
import showUploadJobSpecification from '~/features/show/upload';
import { registerUploadJobType } from '~/features/upload/jobs';
import { registerUploadJobResultPanel } from '~/features/upload/result-panels';

function registerUploadJobTypes() {
  const specs = [
    firmwareUploadJobSpecification,
    parameterUploadJobSpecification,
    missionItemUploadJobSpecification,
    parameterConsistencyCheckJobSpecification,
    showUploadJobSpecification,
  ];
  const disposers = specs.map((spec) => registerUploadJobType(spec));
  disposers.push(
    registerUploadJobResultPanel(
      CONSISTENCY_CHECK_JOB_TYPE,
      ParameterConsistencyCheckResultPanel
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
