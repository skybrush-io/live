import { type BoxProps } from '@material-ui/core/Box';

export type FormHeaderProps = BoxProps & {
  disablePadding?: boolean;
};

declare const FormHeader: ({
  children,
  disablePadding,
  ...rest
}: FormHeaderProps) => JSX.Element;
export default FormHeader;
