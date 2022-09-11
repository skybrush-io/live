import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Button from '@material-ui/core/Button';
import InsertLink from '@material-ui/icons/InsertLink';
import LinkOff from '@material-ui/icons/LinkOff';

import ExternalWindow from './ExternalWindow';

import { isDetached } from './selectors';
import { attachPanel, detachPanel } from './slice';

const DetachablePanelPresentation = ({
  attach,
  children,
  detach,
  detached,
  title,
}) => {
  const toggleButton = (
    <Button
      variant='outlined'
      startIcon={detached ? <InsertLink /> : <LinkOff />}
      onClick={detached ? attach : detach}
    >
      {detached ? 'Attach' : 'Detach'}
    </Button>
  );

  const toggleDiv = (
    <div
      style={{
        textAlign: 'center',
        position: 'absolute',
        bottom: '10px',
        left: '50%',
        transform: 'translate(-50%)',
        zIndex: '100',
      }}
    >
      {toggleButton}
    </div>
  );

  return detached ? (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: '100%',
          textAlign: 'center',
        }}
      >
        <div>
          {title} panel has been detached.
          <br />
          {toggleButton}
        </div>
      </div>
      <ExternalWindow title={title} onClose={attach}>
        <div>{children}</div>
        {toggleDiv}
      </ExternalWindow>
    </>
  ) : (
    <>
      <div>{children}</div>
      {toggleDiv}
    </>
  );
};

DetachablePanelPresentation.propTypes = {
  attach: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  detach: PropTypes.func.isRequired,
  detached: PropTypes.bool.isRequired,
  title: PropTypes.string,
};

DetachablePanelPresentation.defaultProps = {};

const DetachablePanel = connect(
  // mapStateToProps
  (state, ownProps) => ({
    detached: isDetached(state, ownProps.title),
  }),
  // mapDispatchToProps
  (dispatch, { title }) => ({
    detach() {
      dispatch(detachPanel({ title }));
    },
    attach() {
      dispatch(attachPanel(title));
    },
  })
)(DetachablePanelPresentation);

export default DetachablePanel;

export const makeDetachable = (Component, title) =>
  class extends React.Component {
    render() {
      return (
        <DetachablePanel title={title}>
          <Component {...this.props} />
        </DetachablePanel>
      );
    }
  };
