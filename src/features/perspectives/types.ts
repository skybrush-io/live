import type { IWorkbenchState } from 'react-flexible-workbench';

export type Perspective = {
  label: string;
  isFixed: boolean;
  state: IWorkbenchState & {
    settings: IWorkbenchState['settings'] & { hasHeaders: boolean };
  };
};
