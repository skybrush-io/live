import { Status } from '@skybrush/app-theme-material-ui';

const _statusToPriority = {
  [Status.CRITICAL]: 100,
  [Status.ERROR]: 90,
  [Status.WARNING]: 80,
  [Status.MISSING]: 70,
  [Status.RTH]: 60,
  [Status.SKIPPED]: 50,
  [Status.NEXT]: 40,
  [Status.INFO]: 30,
  [Status.SUCCESS]: 20,
  [Status.WAITING]: 10,
  [Status.OFF]: 0,
};

export const statusToPriority = (status) => _statusToPriority[status] || 0;

export { Status } from '@skybrush/app-theme-material-ui';
