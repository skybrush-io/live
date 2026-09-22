import { useSelector } from 'react-redux';
import UploadStatusLights from './UploadStatusLights';
import { getUploadJobResultPanel } from './result-panels';
import { getSelectedTabInUploadDialog } from './selectors';

type UploadPanelProps = Readonly<{
  jobType: string;
}>;

/**
 * Presentation component for the main panel that allows the user to monitor the
 * status of an upload job.
 */
const UploadPanel = ({ jobType }: UploadPanelProps) => {
  let selectedTab = useSelector(getSelectedTabInUploadDialog);
  const resultPanel = getUploadJobResultPanel(jobType);
  const supportsResults = resultPanel !== undefined;

  if (!supportsResults) {
    selectedTab = 'status';
  }

  switch (selectedTab) {
    case 'status':
      return <UploadStatusLights />;

    case 'results':
      return resultPanel !== undefined ? resultPanel() : null;

    default:
      return null;
  }
};

export default UploadPanel;
