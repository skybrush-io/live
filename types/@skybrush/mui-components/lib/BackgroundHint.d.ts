/* eslint-disable @typescript-eslint/ban-types */
/**
 * @file Component that gives a hint to the user about the usage of the
 * application.
 */
import type * as React from 'react';

export type BackgroundHintProps = React.RefAttributes<unknown> & {
  button?: React.ReactNode;
  header?: string;
  icon?: React.ReactElement;
  iconColor?: string;
  text?: string | null;
};

/**
 * Component that gives a hint to the user about the usage of the
 * application.
 *
 * The hint is presented as text in large print placed in the middle of
 * the area dedicated to the component.
 *
 * @return {Object} the rendered component
 */
declare const BackgroundHint: ({
  button,
  header,
  icon,
  iconColor,
  text,
  ...rest
}: BackgroundHintProps) => JSX.Element;
export default BackgroundHint;
