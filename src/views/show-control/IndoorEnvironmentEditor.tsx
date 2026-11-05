import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import type { Vector3Tuple } from '@skybrush/math';
import { FormHeader } from '@skybrush/mui-components';

import XYZFields from '~/components/XYZFields';
import {
  setFirstCornerOfRoom,
  setSecondCornerOfRoom,
} from '~/features/show/actions';
import { getRoomCorners, isRoomVisible } from '~/features/show/selectors';
import { setRoomVisibility } from '~/features/show/slice';
import type { RootState } from '~/store/reducers';

type Props = {
  roomVisible: boolean;
  firstCorner: Vector3Tuple;
  secondCorner: Vector3Tuple;
  onRoomVisibilityChanged: React.ChangeEventHandler<HTMLInputElement>;
  onFirstCornerChanged: (value: Vector3Tuple) => void;
  onSecondCornerChanged: (value: Vector3Tuple) => void;
};

/**
 * Presentation component for the form that allows the user to edit the
 * environment of an outdoor drone show.
 */
const IndoorEnvironmentEditor = ({
  roomVisible,
  firstCorner,
  secondCorner,
  onRoomVisibilityChanged,
  onFirstCornerChanged,
  onSecondCornerChanged,
}: Props) => {
  const { t } = useTranslation();

  return (
    <FormGroup>
      <FormHeader>
        {t('indoorEnvironmentEditor.coordinatesOfTheCorners')}
      </FormHeader>
      <XYZFields value={firstCorner} onChange={onFirstCornerChanged} />
      <Box sx={{ p: 1 }} />
      <XYZFields value={secondCorner} onChange={onSecondCornerChanged} />
      <Box sx={{ p: 1 }} />
      <FormControlLabel
        label={t('indoorEnvironmentEditor.roomVisibleIn3D')}
        control={
          <Checkbox
            checked={Boolean(roomVisible)}
            onChange={onRoomVisibilityChanged}
          />
        }
      />
    </FormGroup>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => {
    const corners = getRoomCorners(state);
    return {
      firstCorner: corners[0],
      secondCorner: corners[1],
      roomVisible: isRoomVisible(state),
    };
  },

  // mapDispatchToProps
  {
    onRoomVisibilityChanged: (event: React.ChangeEvent<HTMLInputElement>) =>
      setRoomVisibility(event.target.checked),
    onFirstCornerChanged: setFirstCornerOfRoom,
    onSecondCornerChanged: setSecondCornerOfRoom,
  }
)(IndoorEnvironmentEditor);
