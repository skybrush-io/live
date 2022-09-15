import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import Button from '@material-ui/core/Button';
import RestoreWindow from '~/icons/RestoreWindow';

import { isDetached } from './selectors';
import { attachPanel, detachPanel } from './slice';

const getOrCreatePortalContainer = (tab) => {
  const found = tab.element[0].querySelector('.portal-container');
  if (found !== null) {
    return found;
  } else {
    const portalContainer = document.createElement('div');
    portalContainer.classList.add('portal-container');
    portalContainer.style.display = 'inline-block';
    tab.titleElement[0].after(portalContainer);
    return portalContainer;
  }
};

const DetachButtonPortal = ({ glContainer, label, onClick }) => {
  const [container, setContainer] = useState(
    getOrCreatePortalContainer(glContainer.tab)
  );

  useEffect(() => {
    const tabHandler = (tab) => setContainer(getOrCreatePortalContainer(tab));
    glContainer.on('tab', tabHandler);
    return () => {
      glContainer.off('tab', tabHandler);
    };
  }, [glContainer]);

  const detachButton = (
    <div
      style={{
        width: '18px',
        height: '18px',
        position: 'relative',
        marginLeft: '5px',
        marginRight: '-10px',
      }}
    >
      <ul className='lm_controls'>
        {/*
          GoldenLayout has a built-in popout feature, which is not suitable for
          our purposes, but we can reuse the icon that would be on the stack.
        */}
        <li className='lm_popout' title={`Detach ${label}`} onClick={onClick} />
      </ul>
    </div>
  );

  return ReactDOM.createPortal(detachButton, container);
};

DetachButtonPortal.propTypes = {
  glContainer: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

const DetachablePanelPresentation = ({
  attach,
  children,
  detach,
  detached,
  glContainer,
  label,
}) => {
  return detached ? (
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
        {label} panel has been detached.
        <br style={{ margin: '1em' }} />
        <Button
          variant='outlined'
          startIcon={<RestoreWindow />}
          onClick={attach}
        >
          Attach
        </Button>
      </div>
    </div>
  ) : (
    <>
      <DetachButtonPortal
        glContainer={glContainer}
        label={label}
        onClick={detach}
      />
      {children}
    </>
  );
};

DetachablePanelPresentation.propTypes = {
  attach: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  detach: PropTypes.func.isRequired,
  detached: PropTypes.bool.isRequired,
  glContainer: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
};

const DetachablePanel = connect(
  // mapStateToProps
  (state, ownProps) => ({
    detached: isDetached(state, ownProps.name),
  }),
  // mapDispatchToProps
  (dispatch, { name }) => ({
    detach() {
      dispatch(detachPanel({ name }));
    },
    attach() {
      dispatch(attachPanel(name));
    },
  })
)(DetachablePanelPresentation);

export default DetachablePanel;

export const makeDetachable = (name, label, Component) =>
  class extends React.Component {
    static propTypes = {
      glContainer: PropTypes.object.isRequired,
    };

    render() {
      const { glContainer, ...rest } = this.props;
      return (
        <DetachablePanel {...{ glContainer, name, label }}>
          <Component {...{ glContainer, ...rest }} />
        </DetachablePanel>
      );
    }
  };
