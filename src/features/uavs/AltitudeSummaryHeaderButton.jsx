import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { connect } from 'react-redux';

import Terrain from '@material-ui/icons/Terrain';

import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';

import { isConnected } from '~/features/servers/selectors';

import AltitudeSummaryUpdater from './AltitudeSummaryUpdater';

const buttonStyle = {
  justifyContent: 'space-between',
  textAlign: 'right',
  width: 90,
};

const INITIAL_STATE = {
  min: 121.6,
  max: 123.4,
};

const AltitudeSummaryHeaderButton = ({ isConnected }) => {
  const [{ min, max }, setSummary] = useState(INITIAL_STATE);

  return (
    <GenericHeaderButton
      disabled={!isConnected}
      label={
        isConnected && typeof max === 'number' ? `${max.toFixed(1)}m` : '—'
      }
      secondaryLabel={
        isConnected && typeof min === 'number' ? `${min.toFixed(1)}m` : '—'
      }
      style={buttonStyle}
    >
      <Terrain />
      {isConnected && <AltitudeSummaryUpdater onSetStatus={setSummary} />}
    </GenericHeaderButton>
  );
};

AltitudeSummaryHeaderButton.propTypes = {
  isConnected: PropTypes.bool,
};

export default connect(
  // mapStateToProps
  (state) => ({
    isConnected: isConnected(state),
  }),
  // mapDispatchToProps
  {}
)(AltitudeSummaryHeaderButton);
