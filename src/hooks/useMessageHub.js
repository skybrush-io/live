import messageHub from '~/message-hub';

/**
 * Hook that attaches to the main message hub of the application and returns
 * a reference to it.
 */
const useMessageHub = () => {
  // TODO(ntamas): solve this with a React context instead!
  return messageHub;
};

export default useMessageHub;
