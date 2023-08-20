export enum PromptDialogType {
  PROMPT = 'prompt',
  CONFIRMATION = 'confirm',
}

export type PromptOptions = {
  cancelButtonLabel: string;
  fieldType: string;
  hintText?: string;
  initialValue?: string;
  message?: string;
  submitButtonLabel: string;
  title?: string;
  type?: PromptDialogType;
};
