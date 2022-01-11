import parameterUploadJobSpecification from '~/features/parameters/upload';
import showUploadJobSpecification from '~/features/show/upload';
import { registerUploadJobType } from '~/features/upload/jobs';

function registerUploadJobTypes() {
  const specs = [parameterUploadJobSpecification, showUploadJobSpecification];
  const disposers = specs.map((spec) => registerUploadJobType(spec));

  disposers.reverse();

  return () => {
    for (const disposer of disposers) {
      disposer();
    }
  };
}

export default registerUploadJobTypes;
