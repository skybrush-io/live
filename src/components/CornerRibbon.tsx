import clsx from 'clsx';

import '~/../assets/css/corner-ribbon.less';

type CornerRibbonPosition =
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight';

const positionMap: Record<CornerRibbonPosition, string> = {
  topLeft: 'left-top',
  topRight: 'right-top',
  bottomLeft: 'left-bottom',
  bottomRight: 'right-bottom',
};

type Props = {
  label: string;
  position?: CornerRibbonPosition;
};

const CornerRibbon = ({ label, position = 'topRight' }: Props) => (
  <div
    className={clsx('corner-ribbon', positionMap[position])}
    data-ribbon={label}
  />
);

export default CornerRibbon;
