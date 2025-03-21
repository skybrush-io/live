import type { TransitionProps } from 'react-transition-group/Transition';

export type FadeAndSlideProps = Readonly<{
  children: React.ReactNode;
  direction?: 'up' | 'left';
  in: boolean;
  style?: React.CSSProperties;
}> &
  Pick<
    TransitionProps,
    'mountOnEnter' | 'unmountOnExit' | 'onEnter' | 'onExit' | 'timeout'
  >;

declare const FadeAndSlide: React.FC<FadeAndSlideProps>;
export default FadeAndSlide;
