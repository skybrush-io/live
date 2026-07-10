import firmwareUploadJobSpecification from '~/features/firmware-update/upload';
import missionItemUploadJobSpecification from '~/features/mission/upload';
import parameterConsistencyCheckJobSpecification from '~/features/parameters/consistency-check';
import parameterUploadJobSpecification from '~/features/parameters/upload';
import showUploadJobSpecification from '~/features/show/upload';
import { registerUploadJobType } from '~/features/upload/jobs';

function registerUploadJobTypes() {
  const specs = [
    firmwareUploadJobSpecification,
    parameterUploadJobSpecification,
    missionItemUploadJobSpecification,
    parameterConsistencyCheckJobSpecification,
    showUploadJobSpecification,
  ];
  const disposers = specs.map((spec) => registerUploadJobType(spec));

  disposers.reverse();

  return () => {
    for (const disposer of disposers) {
      disposer();
    }
  };
}

export default registerUploadJobTypes;
