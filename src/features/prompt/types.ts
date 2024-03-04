export type PromptResponse = Record<string, any> | undefined;

export enum PromptDialogType {
  GENERIC = 'generic',
  CONFIRMATION = 'confirmation',
}

export type PromptOptions = Partial<{
  cancelButtonLabel: string;
  initialValues: Record<string, any>;
  message: string;
  schema: Record<string, any>;
  submitButtonLabel: string;
  title: string;
}>;
