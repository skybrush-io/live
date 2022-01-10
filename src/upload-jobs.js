import parameterUploadJobSpecification from '~/features/parameters/upload';
import showUploadJobSpecification from '~/features/show/upload';
import { registerUploadJobType } from '~/features/upload/jobs';

function registerUploadJobTypes() {
  const specs = [parameterUploadJobSpecification, showUploadJobSpecification];
  for (const spec of specs) {
    registerUploadJobType(spec);
  }
}

export default registerUploadJobTypes;
