import type React from 'react';
import { createElement } from 'react';

type UploadJobResultPanelRenderer = () => React.ReactElement;

const UPLOAD_JOB_RESULT_PANELS: Record<string, UploadJobResultPanelRenderer> =
  {};

/**
 * Registers a result panel component for the given upload job type.
 *
 * The panel is rendered with the given props whenever the results tab
 * is shown for a job of this type.
 *
 * @returns a disposer function that can be called to unregister the panel
 */
export function registerUploadJobResultPanel<Props extends object>(
  jobType: string,
  component: React.ComponentType<Props>,
  props: Props
): () => void {
  const existing = UPLOAD_JOB_RESULT_PANELS[jobType];
  if (existing !== undefined) {
    throw new Error(
      `Upload job result panel for ${jobType} is already registered`
    );
  }

  UPLOAD_JOB_RESULT_PANELS[jobType] = () => createElement(component, props);

  return () => {
    delete UPLOAD_JOB_RESULT_PANELS[jobType];
  };
}

/**
 * Returns the registered result panel renderer for the given upload job type,
 * or undefined if no panel is registered for it.
 */
export function getUploadJobResultPanel(
  jobType: string
): UploadJobResultPanelRenderer | undefined {
  return UPLOAD_JOB_RESULT_PANELS[jobType];
}
