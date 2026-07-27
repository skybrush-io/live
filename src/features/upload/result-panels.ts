import type React from 'react';

type UploadJobResultPanelComponent = React.ComponentType;

const UPLOAD_JOB_RESULT_PANELS: Record<string, UploadJobResultPanelComponent> =
  {};

/**
 * Registers a result panel component for the given upload job type.
 *
 * @returns a disposer function that can be called to unregister the panel
 */
export function registerUploadJobResultPanel(
  jobType: string,
  component: UploadJobResultPanelComponent
): () => void {
  const existing = UPLOAD_JOB_RESULT_PANELS[jobType];
  if (existing) {
    throw new Error(
      `Upload job result panel for ${jobType} is already registered`
    );
  }

  UPLOAD_JOB_RESULT_PANELS[jobType] = component;

  return () => {
    delete UPLOAD_JOB_RESULT_PANELS[jobType];
  };
}

/**
 * Returns the registered result panel component for the given upload job type,
 * or undefined if no panel is registered for it.
 */
export function getUploadJobResultPanel(
  jobType: string
): UploadJobResultPanelComponent | undefined {
  return UPLOAD_JOB_RESULT_PANELS[jobType];
}
