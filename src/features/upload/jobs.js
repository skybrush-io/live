export const JobType = {
  PARAMETER_UPLOAD: 'parameterUpload',
  SHOW_UPLOAD: 'showUpload',
};

const DIALOG_TITLES = {
  [JobType.PARAMETER_UPLOAD]: 'Upload parameters',
  [JobType.SHOW_UPLOAD]: 'Upload show data',
};

export function getDialogTitleForJobType(type) {
  return DIALOG_TITLES[type] ?? 'Upload data';
}
