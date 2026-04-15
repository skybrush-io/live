import config from 'config';
import { Toaster } from 'react-hot-toast';
import { DEFAULT_DURATION } from './constants';

const Notifications = () => (
  <Toaster
    position={config.toastPlacement}
    toastOptions={{
      duration: DEFAULT_DURATION,
      style: { padding: '0px' },
    }}
  />
);

export default Notifications;
