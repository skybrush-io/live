import { MiniList, MiniListItem } from '@skybrush/mui-components';

import type { ResolvedPrerequisite } from '~/hooks/useConstPrerequisites';

type Props = {
  prerequisites: readonly ResolvedPrerequisite[];
};

const PrerequisiteList = ({ prerequisites }: Props) => {
  return (
    <MiniList>
      {prerequisites.map(({ id, result, message }) => (
        <MiniListItem
          key={id}
          iconPreset={result ? 'success' : 'error'}
          primaryText={message}
        />
      ))}
    </MiniList>
  );
};

export default PrerequisiteList;
