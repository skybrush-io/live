import { use } from 'react';

import type MessageHub from '~/flockwave/messages';
import { MessageHubContext } from '~/message-hub';

/**
 * Hook that attaches to the main message hub of the application and returns
 * a reference to it.
 */
const useMessageHub = (): MessageHub => use(MessageHubContext);

export default useMessageHub;
